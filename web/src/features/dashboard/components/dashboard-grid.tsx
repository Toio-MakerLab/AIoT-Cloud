import { GridLayout, type Layout, useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import type { IDashboardWidget, IDevice } from '../api/types';
import type { ILatestTelemetry, ITelemetryPoint } from '../hooks/use-device-socket';
import { DevicePanel } from './device-panel';

interface Props {
  widgets: IDashboardWidget[];
  devices: IDevice[];
  latestByDevice: Map<string, ILatestTelemetry>;
  historyByDevice: Map<string, ITelemetryPoint[]>;
  seedHistory: (deviceId: string, points: ITelemetryPoint[]) => void;
  onLayoutChange: (widgets: IDashboardWidget[]) => void;
  onRemoveWidget: (widgetId: string) => void;
}

const ROW_HEIGHT = 80;
const COLS = 12;

/**
 * Wraps react-grid-layout v2's `GridLayout` component. v2 dropped the `WidthProvider` HOC in
 * favor of the `useContainerWidth` hook (see react-grid-layout README "Providing Grid Width" /
 * "Migrating from v1"), and requires an explicit `layout` prop (no more `data-grid` on
 * children). Grid sizing (cols/rowHeight/margin/containerPadding) is grouped under the
 * `gridConfig` prop in v2 instead of flat props.
 */
export function DashboardGrid({ widgets, devices, latestByDevice, historyByDevice, seedHistory, onLayoutChange, onRemoveWidget }: Props) {
  const { width, containerRef, mounted } = useContainerWidth();

  const layout: Layout = widgets.map((widget) => ({
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
            cols: COLS,
            rowHeight: ROW_HEIGHT,
            margin: [12, 12],
            containerPadding: [0, 0],
          }}
          onLayoutChange={handleLayoutChange}
        >
          {widgets.map((widget) => {
            const device = devices.find((d) => d.id === widget.deviceId);
            return (
              <div key={widget.id}>
                <DevicePanel
                  widget={widget}
                  device={device}
                  latest={latestByDevice.get(widget.deviceId)}
                  history={historyByDevice.get(widget.deviceId) ?? []}
                  seedHistory={seedHistory}
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
