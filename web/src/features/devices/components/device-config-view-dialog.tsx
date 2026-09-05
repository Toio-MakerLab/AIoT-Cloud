import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getDevicePushChannelLabel } from '../data/data';
import type { Device } from '../data/schema';

interface Props {
  currentRow: Device;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-3 gap-x-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-all font-mono">{value || '—'}</span>
    </div>
  );
}

export function DeviceConfigViewDialog({ currentRow, open, onOpenChange }: Props) {
  const { t } = useTranslation('devices');
  const { config, pushChannel, alertRules, failsafe, template } = currentRow;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>{t('configViewDialog.title')}</DialogTitle>
          <DialogDescription>{t('configViewDialog.description')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Row label={t('configFields.apiEndpoint')} value={config?.apiEndpoint} />
          <Row label={t('configFields.pushChannel')} value={getDevicePushChannelLabel(pushChannel)} />

          {pushChannel === 'MQTT' ? (
            <>
              <Row label={t('configFields.broker')} value={config?.mqtt?.broker} />
              <Row label={t('configFields.port')} value={config?.mqtt?.port ? String(config.mqtt.port) : undefined} />
              <Row label={t('configFields.username')} value={config?.mqtt?.username} />
              <Row label={t('configFields.telemetryTopic')} value={config?.mqtt?.topics?.telemetry} />
              <Row label={t('configFields.commandTopic')} value={config?.mqtt?.topics?.command} />
              <Row label={t('configFields.statusTopic')} value={config?.mqtt?.topics?.status} />
              <Row label={t('configFields.eventTopic')} value={config?.mqtt?.topics?.event} />
              {config?.mqtt?.topics?.channels?.map((channel) => (
                <Row
                  key={channel.index}
                  label={t('configFields.channelLabel', { index: channel.index, label: channel.label })}
                  value={channel.topic}
                />
              ))}
            </>
          ) : null}

          {pushChannel === 'HTTP' ? <Row label={t('configFields.pushUrl')} value={config?.http?.url} /> : null}

          {pushChannel === 'KAFKA' ? (
            <>
              <Row label={t('configFields.brokers')} value={config?.kafka?.brokers} />
              <Row label={t('configFields.topics')} value={config?.kafka?.topics?.join(', ')} />
              <Row label={t('configFields.commandTopic')} value={config?.kafka?.commandTopic} />
              <Row label={t('configFields.clientId')} value={config?.kafka?.clientId} />
              <Row label={t('configFields.username')} value={config?.kafka?.username} />
            </>
          ) : null}

          {template?.type === 'GATEWAY' ? (
            <>
              <Row label={t('configViewDialog.alertRules')} value={alertRules?.join(', ')} />
              <Row
                label={t('configFields.failsafe')}
                value={failsafe?.enabled ? failsafe.rules?.join(', ') || t('configViewDialog.enabledNoActions') : t('configViewDialog.disabled')}
              />
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
