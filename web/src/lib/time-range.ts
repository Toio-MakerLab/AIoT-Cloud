// Shared presets for every telemetry-history time-range filter (the dashboard's CHART/VALUE
// panels, the device detail page's TelemetryHistoryPanel) — same role as chart-colors.ts: a
// cross-feature UI utility with no domain/API types, so unlike this codebase's usual
// "duplicate per-feature" convention, it's fine (and preferable, given the date math involved) to
// share it directly rather than fork it.

export type TimeRangePreset = '1h' | '6h' | '24h' | '7d' | '30d';

// Labels come from the `common` i18n namespace (`timeRange.*`) rather than being hardcoded here,
// so callers build the option list via `getTimeRangeOptions(t)` instead of importing a static array.
export function getTimeRangeOptions(t: (key: string, options?: Record<string, unknown>) => string): { value: TimeRangePreset; label: string }[] {
  return [
    { value: '1h', label: t('timeRange.lastHour') },
    { value: '6h', label: t('timeRange.last6Hours') },
    { value: '24h', label: t('timeRange.last24Hours') },
    { value: '7d', label: t('timeRange.last7Days') },
    { value: '30d', label: t('timeRange.last30Days') },
  ];
}

const HOUR_MS = 60 * 60 * 1000;
const PRESET_MS: Record<TimeRangePreset, number> = {
  '1h': HOUR_MS,
  '6h': 6 * HOUR_MS,
  '24h': 24 * HOUR_MS,
  '7d': 7 * 24 * HOUR_MS,
  '30d': 30 * 24 * HOUR_MS,
};

export interface ResolvedTimeRange {
  from: Date;
  to: Date;
  /**
   * Stable identity for this resolved window, used to key both the telemetry query cache and a
   * seed-once-per-range decision (see the dashboard's use-device-socket.ts `seedHistory`).
   * Deliberately just the preset (not the concrete from/to instants) — re-anchoring `to` to "now"
   * on every render/reselect would otherwise change the query key continuously and refetch in a
   * loop. Reselecting the same preset is a no-op (`<Select>` only fires `onValueChange` on an
   * actual change); pick a different preset and back again to force a refresh of the window.
   */
  key: TimeRangePreset;
}

/** Resolves a preset into concrete (fixed at call time, not sliding) from/to bounds. */
export function resolveTimeRange(preset: TimeRangePreset, now: Date = new Date()): ResolvedTimeRange {
  return { from: new Date(now.getTime() - PRESET_MS[preset]), to: now, key: preset };
}
