import { IconBolt, IconCpu, IconDeviceUnknown, IconRouter, IconServer2, IconX } from '@tabler/icons-react';
import { useEffect } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useIsGuest } from '@/hooks/use-is-guest';
import { getChartColor } from '@/lib/chart-colors';
import type { ResolvedTimeRange } from '@/lib/time-range';
import { cn } from '@/lib/utils';
import { useDeviceTelemetryHistoryQuery, useTriggerDeviceActionMutation } from '../api/queries';
import type { IDashboardWidget, IDevice, IDeviceTemplate } from '../api/types';
import type { ILatestTelemetry, ITelemetryPoint } from '../hooks/telemetry-types';

interface Props {
  widget: IDashboardWidget;
  device: IDevice | undefined;
  latest: ILatestTelemetry | undefined;
  history: ITelemetryPoint[];
  seedHistory: (deviceId: string, points: ITelemetryPoint[], key: string) => void;
  timeRange: ResolvedTimeRange;
  onRemove: () => void;
}

// Fallback icon per template type, used whenever the template's own `icon` isn't an image URL —
// same mapping as device-templates' data.ts, duplicated here per this feature's "self-contained
// types" convention (see api/types.ts).
const TEMPLATE_TYPE_ICONS: Record<string, typeof IconCpu> = {
  SENSOR_NODE: IconCpu,
  RELAY_NODE: IconRouter,
  RELAY_CURRENT_NODE: IconBolt,
  GATEWAY: IconServer2,
  OTHER: IconDeviceUnknown,
};

/** Small image/icon that visually represents a device, based on its template. */
function DeviceImage({ template }: { template: IDeviceTemplate | undefined }) {
  const icon = template?.icon;
  const isImageUrl = !!icon && (icon.startsWith('http://') || icon.startsWith('https://') || icon.startsWith('/'));

  if (isImageUrl) {
    return <img src={icon} alt={template?.name ?? 'Device'} className="h-8 w-8 shrink-0 rounded object-cover" />;
  }

  const FallbackIcon = (template?.type && TEMPLATE_TYPE_ICONS[template.type]) || IconDeviceUnknown;
  return (
    <div className="bg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded">
      <FallbackIcon className="text-muted-foreground h-4 w-4" />
    </div>
  );
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

export function DevicePanel({ widget, device, latest, history, seedHistory, timeRange, onRemove }: Props) {
  // Seed the rolling history buffer once fetched — combined with any live telemetry already
  // appended by the WebSocket live-data source, this gives charts both history and a live tail.
  // Bounded by the dashboard's time-range filter (see @/lib/time-range); `timeRange.key` is what lets
  // seedHistory tell "the same range refetched" apart from "the user picked a different range".
  const { data: fetchedHistory } = useDeviceTelemetryHistoryQuery(widget.deviceId, { from: timeRange.from, to: timeRange.to });
  const isGuest = useIsGuest();

  // biome-ignore lint/correctness/useExhaustiveDependencies: seedHistory is an unstable reference from the parent's live-data hook; adding it would re-run the effect on every render.
  useEffect(() => {
    // `fetchedHistory` is `undefined` only while still loading — an empty array is a resolved "no
    // telemetry in this range" and must still seed (as empty), otherwise switching to an empty
    // range would leave the previous range's points on screen.
    if (fetchedHistory) {
      seedHistory(
        widget.deviceId,
        fetchedHistory.map((t) => ({
          payload: t.payload,
          recordedAt: t.recordedAt,
        })),
        timeRange.key,
      );
    }
  }, [fetchedHistory, widget.deviceId, timeRange.key]);

  const field = widget.field ?? '';
  const lastPoint = history[history.length - 1];
  // Priority: live WS data (telemetry or a channelState confirmation, whichever arrived last —
  // both land in `latest.payload`, see use-device-socket.ts) > last fetched history point > the
  // device's persisted `channelStates` from its last confirmed action, so an ACTION panel shows
  // the real last-applied value on first load instead of "--" until the next live event.
  const currentValue = latest?.payload[field] ?? lastPoint?.payload[field] ?? device?.channelStates?.[field];
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

  // Relay nodes (and other devices whose action is a stateful on/off, not a momentary press) use a
  // real toggle switch instead of separate On/Off buttons — its position reflects the latest
  // telemetry/action value reported for this channel.
  const isToggleAction = actionDef?.type === 'TOGGLE';
  const isToggleOn = isToggleAction && currentValue !== undefined && String(currentValue) === String(actionDef?.onValue ?? 'ON');
  const handleToggle = (checked: boolean) => {
    if (!actionDef) return;
    handleTrigger(checked ? (actionDef.onValue ?? 'ON') : (actionDef.offValue ?? 'OFF'));
  };

  const chartData = history.map((point) => ({
    recordedAt: new Date(point.recordedAt).toLocaleTimeString(),
    value: typeof point.payload[field] === 'number' ? (point.payload[field] as number) : null,
  }));

  // Same name -> same color every render/reload, so panels stay visually distinct from each other
  // without color reshuffling on you between page loads.
  const panelName = widget.title || device?.name || 'Panel';
  const chartColor = getChartColor(panelName);

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden py-3 gap-2">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 px-4">
        <div className="flex min-w-0 items-center gap-2">
          <DeviceImage template={device?.template} />
          <div className="min-w-0">
            <CardTitle className="truncate text-sm font-medium">{panelName}</CardTitle>
            <p className="text-muted-foreground truncate text-xs">
              {device?.name ?? widget.deviceId} · {(widget.widgetType === 'ACTION' ? actionDef?.label : field) || 'no field'}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={cn('h-2 w-2 rounded-full', isOnline ? 'bg-green-500' : 'bg-muted-foreground/40')}
            title={isOnline ? 'Online' : 'Offline'}
          />
          {!isGuest && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove} aria-label="Remove panel">
              <IconX className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 px-4">
        {widget.widgetType === 'ACTION' ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            {actionDef ? (
              isToggleAction ? (
                <div className="flex flex-col items-center gap-1">
                  <Switch checked={isToggleOn} disabled={isGuest || !isOnline || triggerAction.isPending} onCheckedChange={handleToggle} />
                  <span className="text-muted-foreground text-xs">{isToggleOn ? (actionDef.onValue ?? 'ON') : (actionDef.offValue ?? 'OFF')}</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="default"
                    disabled={isGuest || !isOnline || triggerAction.isPending}
                    onClick={() => handleTrigger(actionDef.onValue ?? 'ON')}
                  >
                    On
                  </Button>
                  <Button
                    variant="outline"
                    disabled={isGuest || !isOnline || triggerAction.isPending}
                    onClick={() => handleTrigger(actionDef.offValue ?? 'OFF')}
                  >
                    Off
                  </Button>
                </div>
              )
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
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`${widget.id}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="recordedAt" tick={{ fontSize: 10 }} minTickGap={20} />
              <YAxis tick={{ fontSize: 10 }} width={36} />
              <Tooltip />
              {/* connectNulls: a point whose payload doesn't carry this field maps to `value: null` above —
                  without this, recharts breaks the area at every such gap instead of drawing straight
                  through to the next real point, making it look chopped into disconnected segments.
                  dot: an area/line needs 2+ points to draw anything at all — a freshly-added device
                  with only one point seeded/live so far would otherwise render a totally blank chart,
                  so show a marker dot whenever there isn't enough history yet to draw a real line. */}
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                fill={`url(#${widget.id}-fill)`}
                dot={chartData.length <= 1 ? { r: 3, fill: chartColor, stroke: chartColor } : false}
                isAnimationActive={false}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
