import { IconLoader2 } from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIsGuest } from '@/hooks/use-is-guest';
import { getResponseMessage } from '@/lib/response-codes';
import { cn } from '@/lib/utils';
import { useDecommissionDeviceMutation, useDeviceLifecycleQuery, useUpdateDeviceLifecycleMutation } from '../api/queries';
import type { DeviceLifecycleStage } from '../api/types';

interface Props {
  deviceId: string;
}

const stageLabels: Record<DeviceLifecycleStage, string> = {
  NEW: 'New',
  ACTIVE: 'Active',
  AGING: 'Aging',
  MAINTENANCE_DUE: 'Maintenance due',
  END_OF_LIFE: 'End of life',
  DECOMMISSIONED: 'Decommissioned',
};

const stageColors: Record<DeviceLifecycleStage, string> = {
  NEW: 'bg-sky-100/30 text-sky-900 dark:text-sky-200 border-sky-200',
  ACTIVE: 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200',
  AGING: 'bg-amber-100/30 text-amber-900 dark:text-amber-200 border-amber-200',
  MAINTENANCE_DUE: 'bg-orange-100/30 text-orange-900 dark:text-orange-200 border-orange-200',
  END_OF_LIFE: 'bg-red-100/30 text-red-900 dark:text-red-200 border-red-200',
  DECOMMISSIONED: 'bg-neutral-300/40 text-neutral-600 border-neutral-300',
};

function scoreBarColor(score: number) {
  if (score >= 80) return 'bg-teal-500';
  if (score >= 60) return 'bg-amber-500';
  if (score >= 35) return 'bg-orange-500';
  return 'bg-red-500';
}

/**
 * "Đánh giá vòng đời thiết bị" — shows the device's lifecycle stage and 0-100 health score
 * (age vs. expected lifespan, connectivity, telemetry warning-band breaches — see backend
 * DeviceLifecycleService), and lets an owner set the install date / expected lifespan the age
 * factor is computed from, or manually decommission the device.
 */
export function DeviceLifecyclePanel({ deviceId }: Props) {
  const isGuest = useIsGuest();
  const { data, isLoading } = useDeviceLifecycleQuery(deviceId);
  const assessment = data?.data;
  const updateLifecycle = useUpdateDeviceLifecycleMutation(deviceId);
  const decommissionDevice = useDecommissionDeviceMutation(deviceId);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [installedAt, setInstalledAt] = useState('');
  const [expectedLifespanMonths, setExpectedLifespanMonths] = useState('');

  // Seed the editable fields once the assessment (re)loads — a later refetch (e.g. after Save)
  // just confirms the same values back, since the backend echoes what was just persisted.
  useEffect(() => {
    if (!assessment) return;
    setInstalledAt(assessment.installedAt.slice(0, 10));
    setExpectedLifespanMonths(String(assessment.expectedLifespanMonths));
  }, [assessment]);

  if (isLoading || !assessment) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lifecycle Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  const isDecommissioned = assessment.stage === 'DECOMMISSIONED';

  const handleSaveConfig = async () => {
    try {
      await updateLifecycle.mutateAsync({
        installedAt: installedAt ? new Date(installedAt).toISOString() : null,
        expectedLifespanMonths: expectedLifespanMonths ? Number(expectedLifespanMonths) : null,
      });
      toast.success('Lifecycle settings saved');
    } catch (error) {
      toast.error(getResponseMessage(error));
    }
  };

  const handleDecommission = async () => {
    try {
      await decommissionDevice.mutateAsync();
      setConfirmOpen(false);
      toast.success('Device marked as decommissioned');
    } catch (error) {
      toast.error(getResponseMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>Lifecycle Assessment</CardTitle>
          <CardDescription>Health score derived from device age, connectivity, and telemetry warning breaches.</CardDescription>
        </div>
        <Badge variant="outline" className={stageColors[assessment.stage]}>
          {stageLabels[assessment.stage]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums">{assessment.score}</span>
          <span className="text-muted-foreground text-sm">/ 100 health score</span>
        </div>

        <div className="space-y-3">
          {assessment.factors.map((factor) => (
            <div key={factor.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{factor.label}</span>
                <span className="text-muted-foreground tabular-nums">{factor.score}</span>
              </div>
              <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
                <div className={cn('h-full rounded-full', scoreBarColor(factor.score))} style={{ width: `${factor.score}%` }} />
              </div>
              <p className="text-muted-foreground text-xs">{factor.detail}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <span className="text-muted-foreground">Age</span>
          <span>
            {assessment.ageMonths} / {assessment.expectedLifespanMonths} months
          </span>
          <span className="text-muted-foreground">Remaining lifespan</span>
          <span>{assessment.remainingLifespanMonths > 0 ? `${assessment.remainingLifespanMonths} months` : 'Past expected lifespan'}</span>
          <span className="text-muted-foreground">Last assessed</span>
          <span>{new Date(assessment.assessedAt).toLocaleString()}</span>
        </div>

        {isDecommissioned && assessment.decommissionedAt && (
          <p className="text-muted-foreground text-sm">Decommissioned on {new Date(assessment.decommissionedAt).toLocaleString()}.</p>
        )}

        {!isGuest && !isDecommissioned && (
          <div className="space-y-3 rounded-md border p-3">
            <div className="grid grid-cols-2 gap-3">
              <Label className="space-y-1.5">
                <span className="text-muted-foreground text-xs">Installed on</span>
                <Input type="date" value={installedAt} onChange={(event) => setInstalledAt(event.target.value)} />
              </Label>
              <Label className="space-y-1.5">
                <span className="text-muted-foreground text-xs">Expected lifespan (months)</span>
                <Input
                  type="number"
                  min={1}
                  value={expectedLifespanMonths}
                  onChange={(event) => setExpectedLifespanMonths(event.target.value)}
                />
              </Label>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void handleSaveConfig()} disabled={updateLifecycle.isPending}>
                {updateLifecycle.isPending && <IconLoader2 className="h-4 w-4 animate-spin" />}
                Save
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setConfirmOpen(true)}>
                Decommission
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        handleConfirm={() => void handleDecommission()}
        disabled={decommissionDevice.isPending}
        title="Decommission device"
        desc="This marks the device as retired and stops its lifecycle stage from being recomputed. This cannot be undone from here."
        confirmText="Decommission"
        destructive
      />
    </Card>
  );
}
