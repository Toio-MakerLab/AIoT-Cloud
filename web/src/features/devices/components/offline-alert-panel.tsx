import { IconLoader2 } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getResponseMessage } from '@/lib/response-codes';
import { cn } from '@/lib/utils';
import { useUpdateDeviceConfigMutation } from '../api/queries';
import type { DeviceTemplateType, IDeviceOfflineAlertConfig, NotificationChannel } from '../api/types';
import { NOTIFICATION_CHANNEL_OPTIONS } from '../api/types';

interface Props {
  deviceId: string;
  templateType: DeviceTemplateType | undefined;
  offlineAlert: IDeviceOfflineAlertConfig | null | undefined;
}

/**
 * Gateways don't report their own telemetry (they bridge other devices), so `WarningGatesPanel`'s
 * per-field threshold gates never apply to them — this is their equivalent alert rule: notify
 * when the gateway itself is swept OFFLINE (see `DeviceStatusScheduler`/`DeviceWarningListener`).
 */
export function OfflineAlertPanel({ deviceId, templateType, offlineAlert }: Props) {
  const updateConfig = useUpdateDeviceConfigMutation();
  const [enabled, setEnabled] = useState(offlineAlert?.enabled ?? false);
  const [channels, setChannels] = useState<NotificationChannel[]>(offlineAlert?.channels ?? []);

  if (templateType !== 'GATEWAY') {
    return null;
  }

  const toggleChannel = (channel: NotificationChannel) => {
    setChannels((prev) => (prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]));
  };

  const handleSave = async () => {
    try {
      await updateConfig.mutateAsync({
        id: deviceId,
        data: { offlineAlert: { enabled, channels: channels.length > 0 ? channels : undefined } },
      });
      toast.success('Alert rule saved');
    } catch (error) {
      toast.error(getResponseMessage(error));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Rules</CardTitle>
        <CardDescription>Notify when this gateway goes offline (no heartbeat past the offline threshold).</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between rounded-md border p-3">
          <div className="min-w-0">
            <span className="font-medium">Offline alert</span>
            <p className="text-muted-foreground text-sm">Send a notification the moment this device is marked OFFLINE.</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-muted-foreground text-xs">Notify via</Label>
          <div className="flex flex-wrap gap-1.5">
            {NOTIFICATION_CHANNEL_OPTIONS.map((channel) => {
              const selected = channels.includes(channel.value);
              return (
                <button key={channel.value} type="button" onClick={() => toggleChannel(channel.value)}>
                  <Badge variant={selected ? 'default' : 'outline'} className={cn('cursor-pointer', selected && 'hover:bg-primary/90')}>
                    {channel.label}
                  </Badge>
                </button>
              );
            })}
          </div>
          <p className="text-muted-foreground text-xs">No channels selected: alerts go to all your enabled channels.</p>
        </div>

        <Button size="sm" onClick={() => void handleSave()} disabled={updateConfig.isPending}>
          {updateConfig.isPending && <IconLoader2 className="h-4 w-4 animate-spin" />}
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
