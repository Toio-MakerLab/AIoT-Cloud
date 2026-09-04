import { useTranslation } from 'react-i18next';
import type { ResolvedTimeRange } from '@/lib/time-range';
import { cn } from '@/lib/utils';
import type { IDashboardWidget, IDevice } from '../api/types';
import type { DeviceLiveData } from './dashboard-grid';
import { DevicePanel } from './device-panel';

interface Props {
  widgets: IDashboardWidget[];
  devices: IDevice[];
  liveData: DeviceLiveData;
  timeRange: ResolvedTimeRange;
  onRemoveWidget: (widgetId: string) => void;
}

// CHART is the only widget type that needs an explicit height here: recharts' ResponsiveContainer
// measures its parent's *rendered* pixel height, and a wrapper left at its natural `height: auto`
// (no ancestor with a definite height) would measure 0. ACTION/VALUE panels get no wrapper height
// at all — Card's `h-full` on an auto-height ancestor resolves to `auto` per the CSS spec, so they
// simply size to their own content (a switch/button row or a single number).
const CHART_PANEL_HEIGHT = 'h-64 sm:h-72';

/**
 * Dashboard view for mobile *browsers* (viewport width, via useIsMobile — see index.tsx), as
 * opposed to DashboardGrid's `mobile` tier which reacts to its *container's* measured width and
 * still stacks panels through react-grid-layout, spacing them with a fixed ROW_HEIGHT-times-rows
 * pixel calculation (see MOBILE_ROW_HEIGHT/MOBILE_WIDGET_ROWS there). On an actual phone that
 * grid math buys nothing — there's no drag/resize/reposition to support (mobile is read/act-only)
 * and no columns to lay out — so this instead is a plain full-width vertical stack in normal
 * document flow, with each panel's height coming from its own content (or, for CHART, a
 * responsive Tailwind height) rather than a JS-computed row span.
 */
export function DashboardMobile({ widgets, devices, liveData, timeRange, onRemoveWidget }: Props) {
  const { t } = useTranslation('dashboard');

  if (widgets.length === 0) {
    return (
      <div className="text-muted-foreground flex h-64 items-center justify-center rounded-lg border border-dashed">
        {t('grid.emptyState', { addPanel: t('addPanel.title') })}
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {widgets.map((widget) => (
        <div key={widget.id} className={cn('w-full', widget.widgetType === 'CHART' && CHART_PANEL_HEIGHT)}>
          <DevicePanel
            widget={widget}
            device={devices.find((d) => d.id === widget.deviceId)}
            latest={liveData.latestByDevice.get(widget.deviceId)}
            history={liveData.historyByDevice.get(widget.deviceId) ?? []}
            actionResult={liveData.actionResultByDevice.get(widget.deviceId)}
            seedHistory={liveData.seedHistory}
            timeRange={timeRange}
            onRemove={() => onRemoveWidget(widget.id)}
          />
        </div>
      ))}
    </div>
  );
}
