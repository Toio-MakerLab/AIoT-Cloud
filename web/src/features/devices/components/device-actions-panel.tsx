import { IconPower } from '@tabler/icons-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsGuest } from '@/hooks/use-is-guest';
import { useTriggerDeviceActionMutation } from '../api/queries';
import type { IDeviceActionFieldDefinition } from '../api/types';

interface Props {
  deviceId: string;
  actionSchema: IDeviceActionFieldDefinition[] | null | undefined;
  /** Only MQTT/KAFKA push channels have a backend->device delivery path. */
  channelSupported: boolean;
}

function ToggleAction({ action, deviceId }: { action: IDeviceActionFieldDefinition; deviceId: string }) {
  const trigger = useTriggerDeviceActionMutation(deviceId);
  const isGuest = useIsGuest();
  const onValue = action.onValue ?? 'ON';
  const offValue = action.offValue ?? 'OFF';

  const send = async (value: string) => {
    try {
      await trigger.mutateAsync({ key: action.key, value });
      toast.success(`${action.label} -> ${value}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send action');
    }
  };

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-2">
        <IconPower className="text-muted-foreground h-4 w-4" />
        <span className="font-medium">{action.label}</span>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" disabled={isGuest || trigger.isPending} onClick={() => void send(onValue)}>
          On
        </Button>
        <Button size="sm" variant="outline" disabled={isGuest || trigger.isPending} onClick={() => void send(offValue)}>
          Off
        </Button>
      </div>
    </div>
  );
}

function ButtonAction({ action, deviceId }: { action: IDeviceActionFieldDefinition; deviceId: string }) {
  const trigger = useTriggerDeviceActionMutation(deviceId);
  const isGuest = useIsGuest();

  const send = async () => {
    try {
      await trigger.mutateAsync({ key: action.key, value: action.key });
      toast.success(`${action.label} sent`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send action');
    }
  };

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <span className="font-medium">{action.label}</span>
      <Button size="sm" disabled={isGuest || trigger.isPending} onClick={() => void send()}>
        Trigger
      </Button>
    </div>
  );
}

export function DeviceActionsPanel({ deviceId, actionSchema, channelSupported }: Props) {
  if (!actionSchema || actionSchema.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
        <CardDescription>Send a command to this device. Delivery is a live round-trip — the device must be online to receive it.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {!channelSupported ? (
          <Badge variant="outline" className="mb-1">
            Actions are unsupported for this device's push channel
          </Badge>
        ) : (
          actionSchema.map((action) =>
            action.type === 'TOGGLE' ? (
              <ToggleAction key={action.key} action={action} deviceId={deviceId} />
            ) : (
              <ButtonAction key={action.key} action={action} deviceId={deviceId} />
            ),
          )
        )}
      </CardContent>
    </Card>
  );
}
