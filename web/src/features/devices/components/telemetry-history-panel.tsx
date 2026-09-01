import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getChartColor } from '@/lib/chart-colors';
import { resolveTimeRange, TIME_RANGE_OPTIONS, type TimeRangePreset } from '@/lib/time-range';
import { useDeviceTelemetryQuery } from '../api/queries';
import type { ITelemetryFieldDefinition } from '../api/types';

interface Props {
  deviceId: string;
  telemetrySchema: ITelemetryFieldDefinition[] | null | undefined;
}

// Backend hard cap regardless of range (see DeviceTelemetryQueryDto) — requested unconditionally
// so the selected time window (not point count) is what actually bounds the chart.
const TELEMETRY_FETCH_LIMIT = 500;

/**
 * Point-in-time look back at a device's recorded telemetry, one field at a time — distinct from
 * the dashboard's CHART widgets, which merge this same history with a live WebSocket tail for a
 * continuously-updating view. This panel just queries `GET /devices/:id/telemetry` directly (see
 * useDeviceTelemetryQuery) and re-fetches whenever the field or time range changes.
 */
export function TelemetryHistoryPanel({ deviceId, telemetrySchema }: Props) {
  const fields = telemetrySchema ?? [];
  const [fieldKey, setFieldKey] = useState<string | undefined>(fields[0]?.key);
  const [rangePreset, setRangePreset] = useState<TimeRangePreset>('24h');
  // Fixed at selection time rather than sliding with "now" every render — see lib/time-range.ts.
  const timeRange = useMemo(() => resolveTimeRange(rangePreset), [rangePreset]);

  const selectedField = fields.find((f) => f.key === fieldKey) ?? fields[0];
  const { data, isLoading } = useDeviceTelemetryQuery(deviceId, { limit: TELEMETRY_FETCH_LIMIT, from: timeRange.from, to: timeRange.to });
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
          <Select value={rangePreset} onValueChange={(value) => setRangePreset(value as TimeRangePreset)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              {TIME_RANGE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
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
          <p className="text-muted-foreground text-sm">No telemetry recorded in this time range.</p>
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
                  through to the next real point, making it look chopped into disconnected segments.
                  dot: an area/line needs 2+ points to draw anything at all — a device with only one
                  recorded point (e.g. just registered) would otherwise render a totally blank chart
                  with no visual sign the request even succeeded, so show a marker dot whenever there
                  isn't enough history yet to draw a real line. */}
              <Area
                type="monotone"
                dataKey="value"
                stroke={chartColor}
                fill={`url(#${deviceId}-fill)`}
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
