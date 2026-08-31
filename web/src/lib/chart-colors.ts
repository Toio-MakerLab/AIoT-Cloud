// Curated, visually-distinct palette (not raw random RGB) so charts stay readable — hue and
// saturation are tuned to work against both light and dark backgrounds.
const CHART_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#ec4899', // pink
  '#6366f1', // indigo
  '#84cc16', // lime
  '#d946ef', // fuchsia
];

/**
 * Deterministically picks a color from `CHART_COLORS` based on `seed` (e.g. a panel/field name).
 * Same seed always maps to the same color — a real random pick would reshuffle every render/reload,
 * which is more confusing than helpful once you've learned "this panel is the green one".
 */
export function getChartColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return CHART_COLORS[hash % CHART_COLORS.length];
}
