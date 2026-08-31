import { GridLayout, type Layout, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { useIsGuest } from '@/hooks/use-is-guest';
import type { IDashboardWidget, IDevice } from '../api/types';
import type { ILatestTelemetry, ITelemetryPoint } from '../hooks/telemetry-types';
import { DevicePanel } from './device-panel';

export interface DeviceLiveData {
  latestByDevice: Map<string, ILatestTelemetry>;
  historyByDevice: Map<string, ITelemetryPoint[]>;
  seedHistory: (deviceId: string, points: ITelemetryPoint[]) => void;
}

interface Props {
  widgets: IDashboardWidget[];
  devices: IDevice[];
  // All widget types (CHART, ACTION, VALUE) read live data from the same WebSocket source.
  liveData: DeviceLiveData;
  onLayoutChange: (widgets: IDashboardWidget[]) => void;
  onRemoveWidget: (widgetId: string) => void;
}

const ROW_HEIGHT = 80;
const COLS = 12;

// Widgets only ever persist one set of x/y/w/h, positioned on the desktop 12-col grid — narrower
// containers derive their own layout from that instead of storing a separate one per size. These
// thresholds are checked against the grid's own measured `width` (from useContainerWidth), not
// window.innerWidth: what actually determines how cramped a column gets is the grid container
// itself, which can be narrower than the viewport (sidebar, split panes, etc.) or vice versa.
//
// - Tablet: the 12-col grid is squeezed into a scaled-down TABLET_COLS grid — each widget's column
//   position/width scales down proportionally, so relative sizing/order is preserved without
//   needing a hand-authored layout.
// - Mobile: even a handful of columns leaves cells too narrow to be usable, so instead of scaling
//   further, everything stacks into a single full-width column, sized per widget type.
const TABLET_MAX_WIDTH = 900;
const TABLET_COLS = 6;
const MOBILE_MAX_WIDTH = 480;
const MOBILE_COLS = 1;
const MOBILE_ROW_HEIGHT = 90;

// Rows (in MOBILE_ROW_HEIGHT units) each widget type gets when stacked on mobile. CHART panels
// need real vertical room to be readable; ACTION/VALUE panels are just a switch/button row or a
// single number, so giving them the same height as a chart would mean a lot of extra scrolling
// to get through a dashboard that's mostly simple panels.
const MOBILE_WIDGET_ROWS: Record<IDashboardWidget['widgetType'], number> = { CHART: 3, ACTION: 2, VALUE: 2 };

type GridTier = 'mobile' | 'tablet' | 'desktop';

function getTier(width: number): GridTier {
  if (width < MOBILE_MAX_WIDTH) return 'mobile';
  if (width < TABLET_MAX_WIDTH) return 'tablet';
  return 'desktop';
}

/** Scales a desktop column position/width down to a narrower grid's column count, keeping it in bounds. */
function scaleToTablet(widget: IDashboardWidget): Layout[number] {
  const scale = TABLET_COLS / COLS;
  const w = Math.max(1, Math.min(TABLET_COLS, Math.round(widget.w * scale)));
  const x = Math.max(0, Math.min(TABLET_COLS - w, Math.round(widget.x * scale)));
  return { i: widget.id, x, y: widget.y, w, h: widget.h, minW: 1, minH: 2 };
}

/**
 * Wraps react-grid-layout v2's `GridLayout` component. v2 dropped the `WidthProvider` HOC in
 * favor of the `useContainerWidth` hook (see react-grid-layout README "Providing Grid Width" /
 * "Migrating from v1"), and requires an explicit `layout` prop (no more `data-grid` on
 * children). Grid sizing (cols/rowHeight/margin/containerPadding) is grouped under the
 * `gridConfig` prop in v2 instead of flat props.
 */
export function DashboardGrid({ widgets, devices, liveData, onLayoutChange, onRemoveWidget }: Props) {
  const { width, containerRef, mounted } = useContainerWidth();
  const isGuest = useIsGuest();
  const tier = getTier(width);
  // Dragging/resizing a scaled-down or single-column grid is unusable on a cramped container
  // (targets are tiny, gestures fight with page scroll) — only the full desktop grid stays
  // interactive. GUEST accounts are read-only regardless of size.
  const interactive = tier === 'desktop' && !isGuest;

  const cols = tier === 'mobile' ? MOBILE_COLS : tier === 'tablet' ? TABLET_COLS : COLS;
  const rowHeight = tier === 'mobile' ? MOBILE_ROW_HEIGHT : ROW_HEIGHT;

  // Mobile layout is synthesized (stacked, in widget order, each sized per its widget type)
  // rather than read from the widgets' stored x/y/w/h, which describe positions on the desktop
  // 12-col grid and don't translate to a single mobile column. Tablet keeps the desktop
  // positions/order but scales them down to the narrower grid (see scaleToTablet).
  let mobileCursorY = 0;
  const layout: Layout =
    tier === 'mobile'
      ? widgets.map((widget) => {
          const h = MOBILE_WIDGET_ROWS[widget.widgetType];
          const item = { i: widget.id, x: 0, y: mobileCursorY, w: MOBILE_COLS, h, minW: MOBILE_COLS, minH: h };
          mobileCursorY += h;
          return item;
        })
      : tier === 'tablet'
        ? widgets.map(scaleToTablet)
        : widgets.map((widget) => ({
            i: widget.id,
            x: widget.x,
            y: widget.y,
            w: widget.w,
            h: widget.h,
            minW: 2,
            minH: 2,
          }));

  const handleLayoutChange = (newLayout: Layout) => {
    const updated = widgets.map((widget) => {
      const item = newLayout.find((entry) => entry.i === widget.id);
      if (!item) {
        return widget;
      }
      return { ...widget, x: item.x, y: item.y, w: item.w, h: item.h };
    });
    onLayoutChange(updated);
  };

  if (widgets.length === 0) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed">
        No panels yet. Click "Add Panel" to get started.
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      {mounted && (
        <GridLayout
          layout={layout}
          width={width}
          gridConfig={{
            cols,
            rowHeight,
            margin: [12, 12],
            containerPadding: [0, 0],
          }}
          dragConfig={{ enabled: interactive }}
          resizeConfig={{ enabled: interactive }}
          onLayoutChange={interactive ? handleLayoutChange : undefined}
        >
          {widgets.map((widget) => {
            const device = devices.find((d) => d.id === widget.deviceId);
            return (
              <div key={widget.id}>
                <DevicePanel
                  widget={widget}
                  device={device}
                  latest={liveData.latestByDevice.get(widget.deviceId)}
                  history={liveData.historyByDevice.get(widget.deviceId) ?? []}
                  seedHistory={liveData.seedHistory}
                  onRemove={() => onRemoveWidget(widget.id)}
                />
              </div>
            );
          })}
        </GridLayout>
      )}
    </div>
  );
}
