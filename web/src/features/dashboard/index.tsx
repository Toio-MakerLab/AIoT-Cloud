import { IconDeviceFloppy, IconPlus } from '@tabler/icons-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCreateDashboardMutation, useDashboardDevicesQuery, useDashboardsQuery, useUpdateDashboardMutation } from './api/queries';
import type { IDashboard, IDashboardWidget } from './api/types';
import { AddPanelDialog } from './components/add-panel-dialog';
import { DashboardGrid } from './components/dashboard-grid';
import { useDeviceSocket } from './hooks/use-device-socket';

const NEW_DASHBOARD_VALUE = '__new__';

interface DraftDashboard {
  id: string | null;
  name: string;
  isDefault: boolean;
  widgets: IDashboardWidget[];
}

const blankDraft = (): DraftDashboard => ({
  id: null,
  name: 'New Dashboard',
  isDefault: false,
  widgets: [],
});

export default function Dashboard() {
  const dashboardsQuery = useDashboardsQuery();
  const devicesQuery = useDashboardDevicesQuery();
  const createDashboard = useCreateDashboardMutation();
  const updateDashboard = useUpdateDashboardMutation();

  const [draft, setDraft] = useState<DraftDashboard>(blankDraft());
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [hasSelectedInitial, setHasSelectedInitial] = useState(false);

  const dashboards = useMemo(() => dashboardsQuery.data ?? [], [dashboardsQuery.data]);
  const devices = useMemo(() => devicesQuery.data ?? [], [devicesQuery.data]);

  // Once the saved dashboards load, default to the first one (if any) instead of a blank draft.
  useEffect(() => {
    if (!hasSelectedInitial && dashboards.length > 0) {
      const first = dashboards[0];
      setDraft({
        id: first.id,
        name: first.name,
        isDefault: first.isDefault,
        widgets: first.widgets,
      });
      setHasSelectedInitial(true);
    }
  }, [dashboards, hasSelectedInitial]);

  const distinctDeviceIds = useMemo(() => Array.from(new Set(draft.widgets.map((w) => w.deviceId))), [draft.widgets]);
  const { latestByDevice, historyByDevice, seedHistory } = useDeviceSocket(distinctDeviceIds);

  const handleSelectDashboard = (value: string) => {
    setHasSelectedInitial(true);
    if (value === NEW_DASHBOARD_VALUE) {
      setDraft(blankDraft());
      return;
    }
    const selected = dashboards.find((d: IDashboard) => d.id === value);
    if (selected) {
      setDraft({
        id: selected.id,
        name: selected.name,
        isDefault: selected.isDefault,
        widgets: selected.widgets,
      });
    }
  };

  const handleAddWidget = (widget: IDashboardWidget) => {
    setDraft((prev) => ({ ...prev, widgets: [...prev.widgets, widget] }));
  };

  const handleRemoveWidget = (widgetId: string) => {
    setDraft((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w.id !== widgetId),
    }));
  };

  const handleLayoutChange = (widgets: IDashboardWidget[]) => {
    setDraft((prev) => ({ ...prev, widgets }));
  };

  const nextSlot = useMemo(() => {
    const maxY = draft.widgets.reduce((max, w) => Math.max(max, w.y + w.h), 0);
    return { x: 0, y: maxY };
  }, [draft.widgets]);

  const isSaving = createDashboard.isPending || updateDashboard.isPending;

  const handleSave = async () => {
    if (!draft.name.trim()) {
      toast.error('Dashboard name is required.');
      return;
    }
    const payload = {
      name: draft.name.trim(),
      isDefault: draft.isDefault,
      widgets: draft.widgets,
    };
    try {
      if (draft.id) {
        const saved = await updateDashboard.mutateAsync({
          id: draft.id,
          data: payload,
        });
        setDraft({
          id: saved.id,
          name: saved.name,
          isDefault: saved.isDefault,
          widgets: saved.widgets,
        });
      } else {
        const saved = await createDashboard.mutateAsync(payload);
        setDraft({
          id: saved.id,
          name: saved.name,
          isDefault: saved.isDefault,
          widgets: saved.widgets,
        });
      }
      toast.success('Dashboard saved');
    } catch {
      // Error toast is already shown by the global mutation error handler.
    }
  };

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Build a live view of your devices' telemetry.</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select value={draft.id ?? NEW_DASHBOARD_VALUE} onValueChange={handleSelectDashboard}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Select a dashboard" />
            </SelectTrigger>
            <SelectContent>
              {dashboards.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
              <SelectItem value={NEW_DASHBOARD_VALUE}>+ New Dashboard</SelectItem>
            </SelectContent>
          </Select>

          <Input
            className="w-56"
            value={draft.name}
            onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Dashboard name"
          />

          <div className="flex items-center gap-2">
            <Switch
              id="dashboard-is-default"
              checked={draft.isDefault}
              onCheckedChange={(checked) => setDraft((prev) => ({ ...prev, isDefault: checked }))}
            />
            <label htmlFor="dashboard-is-default" className="text-muted-foreground text-sm">
              Default
            </label>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => setAddPanelOpen(true)}>
              <IconPlus className="h-4 w-4" />
              Add Panel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <IconDeviceFloppy className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        <DashboardGrid
          widgets={draft.widgets}
          devices={devices}
          latestByDevice={latestByDevice}
          historyByDevice={historyByDevice}
          seedHistory={seedHistory}
          onLayoutChange={handleLayoutChange}
          onRemoveWidget={handleRemoveWidget}
        />
      </Main>

      <AddPanelDialog open={addPanelOpen} onOpenChange={setAddPanelOpen} devices={devices} nextSlot={nextSlot} onAdd={handleAddWidget} />
    </>
  );
}
