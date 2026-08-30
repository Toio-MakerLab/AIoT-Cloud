import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { useUpdateDeviceConfigMutation } from '../api/queries';
import { type DeviceConfigFormValues, deviceConfigFormDefaults, deviceConfigFormSchema, deviceConfigFormToPayload } from '../data/device-config-form';
import type { Device } from '../data/schema';
import { DeviceConfigFields } from './device-config-fields';

interface Props {
  currentRow: Device;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeviceConfigDialog({ currentRow, open, onOpenChange }: Props) {
  const updateDeviceConfig = useUpdateDeviceConfigMutation();

  const form = useForm<DeviceConfigFormValues>({
    resolver: zodResolver(deviceConfigFormSchema),
    defaultValues: deviceConfigFormDefaults(
      currentRow.config,
      currentRow.pushChannel,
      currentRow.isActive,
      currentRow.deviceId,
      currentRow.template,
      currentRow.alertRules,
      currentRow.failsafe,
    ),
  });

  const pushChannel = form.watch('pushChannel');
  const channelTopics = form.watch('channelTopics');

  const onSubmit = async (values: DeviceConfigFormValues) => {
    try {
      await updateDeviceConfig.mutateAsync({
        id: currentRow.id,
        data: deviceConfigFormToPayload(values, currentRow.template?.type),
      });
      toast.success('Device config updated');
      onOpenChange(false);
    } catch {
      // Error toast is already shown by the global mutation error handler (see main.tsx).
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        onOpenChange(state);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>Device Config</DialogTitle>
          <DialogDescription>Configure the network parameters this device fetches at boot.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="device-config-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-0.5">
            <DeviceConfigFields
              control={form.control}
              pushChannel={pushChannel}
              channelTopics={channelTopics}
              templateType={currentRow.template?.type}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="submit" form="device-config-form" disabled={updateDeviceConfig.isPending}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
