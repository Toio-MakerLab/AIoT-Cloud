import { IconX } from '@tabler/icons-react';
import { useEffect } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useDeviceTelemetryHistoryQuery, useTriggerDeviceActionMutation } from '../api/queries';
import type { IDashboardWidget, IDevice } from '../api/types';
import type { ILatestTelemetry, ITelemetryPoint } from '../hooks/use-device-socket';

interface Props {
  widget: IDashboardWidget;
  device: IDevice | undefined;
  latest: ILatestTelemetry | undefined;
  history: ITelemetryPoint[];
  seedHistory: (deviceId: string, points: ITelemetryPoint[]) => void;
  onRemove: () => void;
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) {
    return '--';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  return String(value);
}

export function DevicePanel({ widget, device, latest, history, seedHistory, onRemove }: Props) {
  // Seed the rolling history buffer once fetched — combined with any live telemetry
  // already appended by the socket hook, this gives charts both history and a live tail.
  const { data: fetchedHistory } = useDeviceTelemetryHistoryQuery(widget.deviceId);

  // biome-ignore lint/correctness/useExhaustiveDependencies: seedHistory is an unstable reference from use-device-socket.ts; adding it would re-run the effect on every render.
  useEffect(() => {
    if (fetchedHistory && fetchedHistory.length > 0) {
      seedHistory(
        widget.deviceId,
        fetchedHistory.map((t) => ({
          payload: t.payload,
          recordedAt: t.recordedAt,
        })),
      );
    }
  }, [fetchedHistory, widget.deviceId]);

  const field = widget.field ?? '';
  const lastPoint = history[history.length - 1];
  const currentValue = latest?.payload[field] ?? lastPoint?.payload[field];
  const lastUpdated = latest?.recordedAt ?? lastPoint?.recordedAt;
  const isOnline = device?.status === 'ONLINE';

  const actionDef = device?.template?.actionSchema?.find((a) => a.key === field);
  const triggerAction = useTriggerDeviceActionMutation(widget.deviceId);
  const handleTrigger = (value: string) => {
    if (!actionDef) return;
    triggerAction.mutate(
      { key: actionDef.key, value },
      {
        onSuccess: () => toast.success(`${actionDef.label} -> ${value}`),
        onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to send action'),
      },
    );
  };

  const chartData = history.map((point) => ({
    recordedAt: new Date(point.recordedAt).toLocaleTimeString(),
    value: typeof point.payload[field] === 'number' ? (point.payload[field] as number) : null,
  }));

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden py-3 gap-2">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 px-4">
        <div className="min-w-0">
          <CardTitle className="truncate text-sm font-medium">{widget.title || device?.name || 'Panel'}</CardTitle>
          <p className="text-muted-foreground truncate text-xs">
            {device?.name ?? widget.deviceId} · {(widget.widgetType === 'ACTION' ? actionDef?.label : field) || 'no field'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn('h-2 w-2 rounded-full', isOnline ? 'bg-green-500' : 'bg-muted-foreground/40')}
            title={isOnline ? 'Online' : 'Offline'}
          />
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove} aria-label="Remove panel">
            <IconX className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-4">
        {widget.widgetType === 'ACTION' ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            {actionDef ? (
              <div className="flex gap-2">
                <Button variant="default" disabled={!isOnline || triggerAction.isPending} onClick={() => handleTrigger(actionDef.onValue ?? 'ON')}>
                  On
                </Button>
                <Button variant="outline" disabled={!isOnline || triggerAction.isPending} onClick={() => handleTrigger(actionDef.offValue ?? 'OFF')}>
                  Off
                </Button>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">Channel not found on device template</span>
            )}
            {!isOnline && <span className="text-muted-foreground text-xs">Device is offline</span>}
          </div>
        ) : widget.widgetType === 'VALUE' ? (
          <div className="flex h-full flex-col items-center justify-center gap-1">
            <span className="text-3xl font-bold">{formatValue(currentValue)}</span>
            <span className="text-muted-foreground text-xs">
              {lastUpdated ? `Updated ${new Date(lastUpdated).toLocaleTimeString()}` : 'No data yet'}
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="recordedAt" tick={{ fontSize: 10 }} minTickGap={20} />
              <YAxis tick={{ fontSize: 10 }} width={36} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="var(--primary)" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
