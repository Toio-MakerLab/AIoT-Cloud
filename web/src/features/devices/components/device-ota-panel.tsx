import { IconLoader2 } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useIsGuest } from '@/hooks/use-is-guest';
import { getResponseMessage } from '@/lib/response-codes';
import { useDeviceOtaHistoryQuery, useDeviceOtaStatusQuery, useFirmwaresForTemplateQuery, useTriggerOtaUpdateMutation } from '../api/queries';
import type { DeviceOtaStatus } from '../api/types';

interface Props {
  deviceId: string;
  templateId: string;
  channelSupported: boolean;
}

const IN_PROGRESS_STATUSES: DeviceOtaStatus[] = ['PENDING', 'DOWNLOADING', 'INSTALLING'];

const statusColors: Record<DeviceOtaStatus, string> = {
  IDLE: 'bg-neutral-100/30 text-neutral-700 dark:text-neutral-300 border-neutral-200',
  PENDING: 'bg-sky-100/30 text-sky-900 dark:text-sky-200 border-sky-200',
  DOWNLOADING: 'bg-amber-100/30 text-amber-900 dark:text-amber-200 border-amber-200',
  INSTALLING: 'bg-amber-100/30 text-amber-900 dark:text-amber-200 border-amber-200',
  SUCCESS: 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200',
  FAILED: 'bg-red-100/30 text-red-900 dark:text-red-200 border-red-200',
};

/**
 * OTA (over-the-air) firmware update panel: shows the device's currently-running version and any
 * in-flight update's progress, lets an owner pick an active build from the template's firmware
 * catalog (see FirmwareManagerDialog, features/device-templates) and push it, and lists past
 * attempts. See backend DeviceOtaService for the push/report round trip this drives.
 */
export function DeviceOtaPanel({ deviceId, templateId, channelSupported }: Props) {
  const { t } = useTranslation('devices');
  const isGuest = useIsGuest();
  const { data: statusData, isLoading: isStatusLoading } = useDeviceOtaStatusQuery(deviceId);
  const { data: historyData } = useDeviceOtaHistoryQuery(deviceId);
  const { data: firmwaresData } = useFirmwaresForTemplateQuery(templateId);
  const triggerUpdate = useTriggerOtaUpdateMutation(deviceId);

  const status = statusData?.data;
  const history = historyData?.data ?? [];
  const activeFirmwares = useMemo(() => (firmwaresData?.data ?? []).filter((firmware) => firmware.isActive), [firmwaresData]);

  const [selectedFirmwareId, setSelectedFirmwareId] = useState<string>('');

  const statusLabels: Record<DeviceOtaStatus, string> = {
    IDLE: t('otaPanel.status.idle'),
    PENDING: t('otaPanel.status.pending'),
    DOWNLOADING: t('otaPanel.status.downloading'),
    INSTALLING: t('otaPanel.status.installing'),
    SUCCESS: t('otaPanel.status.success'),
    FAILED: t('otaPanel.status.failed'),
  };

  if (isStatusLoading || !status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('otaPanel.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">{t('otaPanel.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  const isInProgress = IN_PROGRESS_STATUSES.includes(status.status);

  const handleTrigger = async () => {
    if (!selectedFirmwareId) return;

    try {
      await triggerUpdate.mutateAsync({ firmwareId: selectedFirmwareId });
      toast.success(t('otaPanel.updateDispatched'));
      setSelectedFirmwareId('');
    } catch (error) {
      toast.error(getResponseMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
        <div>
          <CardTitle>{t('otaPanel.title')}</CardTitle>
          <CardDescription>{t('otaPanel.description')}</CardDescription>
        </div>
        <Badge variant="outline" className={statusColors[status.status]}>
          {statusLabels[status.status]}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <span className="text-muted-foreground">{t('otaPanel.currentVersion')}</span>
          <span>{status.currentVersion ?? t('otaPanel.unknown')}</span>
          {status.targetVersion && (
            <>
              <span className="text-muted-foreground">{t('otaPanel.targetVersion')}</span>
              <span>{status.targetVersion}</span>
            </>
          )}
          {status.updatedAt && (
            <>
              <span className="text-muted-foreground">{t('otaPanel.lastUpdated')}</span>
              <span>{new Date(status.updatedAt).toLocaleString()}</span>
            </>
          )}
        </div>

        {isInProgress && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{t('otaPanel.progress')}</span>
              <span className="text-muted-foreground tabular-nums">{status.progress ?? 0}%</span>
            </div>
            <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
              <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${status.progress ?? 0}%` }} />
            </div>
          </div>
        )}

        {status.status === 'FAILED' && status.error && <p className="text-destructive text-sm">{status.error}</p>}

        {!isGuest && channelSupported && !isInProgress && (
          <div className="space-y-3 rounded-md border p-3">
            {activeFirmwares.length === 0 ? (
              <p className="text-muted-foreground text-sm">{t('otaPanel.noFirmwareAvailable')}</p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <Select value={selectedFirmwareId} onValueChange={setSelectedFirmwareId}>
                  <SelectTrigger className="w-56">
                    <SelectValue placeholder={t('otaPanel.selectFirmware')} />
                  </SelectTrigger>
                  <SelectContent>
                    {activeFirmwares.map((firmware) => (
                      <SelectItem key={firmware.id} value={firmware.id}>
                        {firmware.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" disabled={!selectedFirmwareId || triggerUpdate.isPending} onClick={() => void handleTrigger()}>
                  {triggerUpdate.isPending && <IconLoader2 className="h-4 w-4 animate-spin" />}
                  {t('otaPanel.pushUpdate')}
                </Button>
              </div>
            )}
          </div>
        )}

        {!channelSupported && <p className="text-muted-foreground text-sm">{t('otaPanel.channelUnsupported')}</p>}

        {history.length > 0 && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{t('otaPanel.history')}</p>
            <ul className="space-y-1.5">
              {history.slice(0, 5).map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    {entry.fromVersion ?? '—'} → {entry.toVersion}
                  </span>
                  <Badge variant="outline" className={statusColors[entry.status]}>
                    {statusLabels[entry.status]}
                  </Badge>
                  <span className="text-muted-foreground text-xs">{entry.requestedAt ? new Date(entry.requestedAt).toLocaleString() : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
