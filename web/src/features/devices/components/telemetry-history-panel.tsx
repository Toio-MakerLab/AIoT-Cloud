import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getChartColor } from '@/lib/chart-colors';
import { useDeviceTelemetryQuery } from '../api/queries';
import type { ITelemetryFieldDefinition } from '../api/types';

interface Props {
  deviceId: string;
  telemetrySchema: ITelemetryFieldDefinition[] | null | undefined;
}

// Mirrors the backend's DeviceTelemetryQueryDto bounds (limit: 1-500, default 100).
const LIMIT_OPTIONS = [50, 100, 250, 500];

/**
 * Point-in-time look back at a device's recorded telemetry, one field at a time — distinct from
 * the dashboard's CHART widgets, which merge this same history with a live WebSocket tail for a
 * continuously-updating view. This panel just queries `GET /devices/:id/telemetry` directly (see
 * useDeviceTelemetryQuery) and re-fetches whenever the field or point count changes.
 */
export function TelemetryHistoryPanel({ deviceId, telemetrySchema }: Props) {
  const fields = telemetrySchema ?? [];
  const [fieldKey, setFieldKey] = useState<string | undefined>(fields[0]?.key);
  const [limit, setLimit] = useState(100);

  const selectedField = fields.find((f) => f.key === fieldKey) ?? fields[0];
  const { data, isLoading } = useDeviceTelemetryQuery(deviceId, limit);
  const telemetry = data?.data ?? [];

  const chartData = useMemo(() => {
    const key = selectedField?.key;
    return telemetry.map((point) => ({
      recordedAt: new Date(point.recordedAt).toLocaleString(),
      value: key !== undefined && typeof point.payload[key] === 'number' ? (point.payload[key] as number) : null,
    }));
  }, [telemetry, selectedField]);

  // Same field name -> same color every render/reload, and it changes along with the field picker
  // below so switching fields is visually obvious, not just a label change.
  const chartColor = getChartColor(selectedField?.label ?? 'field');

  if (fields.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
        <div>
          <CardTitle>Telemetry History</CardTitle>
          <CardDescription>Recorded values for one field over time.</CardDescription>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedField?.key} onValueChange={setFieldKey}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Field" />
            </SelectTrigger>
            <SelectContent>
              {fields.map((field) => (
                <SelectItem key={field.key} value={field.key}>
                  {field.label}
                  {field.unit ? ` (${field.unit})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(limit)} onValueChange={(value) => setLimit(Number(value))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIMIT_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  Last {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="h-64">
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading history…</p>
        ) : chartData.length === 0 ? (
          <p className="text-muted-foreground text-sm">No telemetry recorded yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`${deviceId}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="recordedAt" tick={{ fontSize: 10 }} minTickGap={40} />
              <YAxis tick={{ fontSize: 10 }} width={40} />
              <Tooltip />
              {/* connectNulls: a point whose payload doesn't carry this field maps to `value: null` above —
                  without this, recharts breaks the area at every such gap instead of drawing straight
                  through to the next real point, making it look chopped into disconnected segments. */}
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                fill={`url(#${deviceId}-fill)`}
                dot={false}
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
