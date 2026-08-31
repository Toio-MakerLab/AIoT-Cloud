import { GridLayout, type Layout, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import { useIsMobile } from '@/hooks/use-mobile';
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

// Below the mobile breakpoint, dragging/resizing a 12-col grid sized for desktop is unusable
// (each column ends up a sliver of the screen) — instead force everything into a single,
// full-width, non-interactive stacked column. Taller rows than desktop's since one row now needs
// to hold a whole panel's content, not a fraction of one sized in desktop grid units.
const MOBILE_COLS = 1;
const MOBILE_ROW_HEIGHT = 260;

/**
 * Wraps react-grid-layout v2's `GridLayout` component. v2 dropped the `WidthProvider` HOC in
 * favor of the `useContainerWidth` hook (see react-grid-layout README "Providing Grid Width" /
 * "Migrating from v1"), and requires an explicit `layout` prop (no more `data-grid` on
 * children). Grid sizing (cols/rowHeight/margin/containerPadding) is grouped under the
 * `gridConfig` prop in v2 instead of flat props.
 */
export function DashboardGrid({ widgets, devices, liveData, onLayoutChange, onRemoveWidget }: Props) {
  const { width, containerRef, mounted } = useContainerWidth();
  const isMobile = useIsMobile();

  // Mobile layout is synthesized (stacked, in widget order) rather than read from the widgets'
  // stored x/y/w/h, which describe positions on the desktop 12-col grid and don't translate to a
  // single mobile column.
  const layout: Layout = isMobile
    ? widgets.map((widget, index) => ({ i: widget.id, x: 0, y: index, w: MOBILE_COLS, h: 1, minW: MOBILE_COLS, minH: 1 }))
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
            cols: isMobile ? MOBILE_COLS : COLS,
            rowHeight: isMobile ? MOBILE_ROW_HEIGHT : ROW_HEIGHT,
            margin: [12, 12],
            containerPadding: [0, 0],
          }}
          dragConfig={{ enabled: !isMobile }}
          resizeConfig={{ enabled: !isMobile }}
          onLayoutChange={isMobile ? undefined : handleLayoutChange}
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
