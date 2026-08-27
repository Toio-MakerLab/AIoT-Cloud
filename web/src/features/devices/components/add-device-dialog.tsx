'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconCamera, IconKeyboard } from '@tabler/icons-react';
import { QRScanner } from '@vkhangstack/veloqr';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeviceTemplatesQuery, useRegisterDeviceMutation, useUpdateDeviceConfigMutation } from '../api/queries';
import { useDevices } from '../context/devices-context';
import { getDeviceTemplateTypeLabel } from '../data/data';
import { type DeviceConfigFormValues, deviceConfigFormDefaults, deviceConfigFormSchema, deviceConfigFormToPayload } from '../data/device-config-form';
import { DeviceConfigFields } from './device-config-fields';

const detailsSchema = z.object({
  templateId: z.string().min(1, { message: 'Please choose a template.' }),
  name: z.string().min(1, { message: 'Device name is required.' }),
});
type DetailsForm = z.infer<typeof detailsSchema>;

type Step = 'details' | 'scan' | 'config';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddDeviceDialog({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<Step>('details');
  const [details, setDetails] = useState<DetailsForm | null>(null);
  const [manualDeviceId, setManualDeviceId] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(true);
  const [registeredDeviceId, setRegisteredDeviceId] = useState<string | null>(null);

  const { data: templatesPage, isLoading: templatesLoading } = useDeviceTemplatesQuery();
  const templates = templatesPage?.data ?? [];
  const registerDevice = useRegisterDeviceMutation();
  const updateDeviceConfig = useUpdateDeviceConfigMutation();

  const form = useForm<DetailsForm>({
    resolver: zodResolver(detailsSchema),
    defaultValues: { templateId: '', name: '' },
  });

  const configForm = useForm<DeviceConfigFormValues>({
    resolver: zodResolver(deviceConfigFormSchema),
    defaultValues: deviceConfigFormDefaults(null, 'MQTT'),
  });
  const configPushChannel = configForm.watch('pushChannel');

  const resetAll = () => {
    form.reset({ templateId: '', name: '' });
    configForm.reset(deviceConfigFormDefaults(null, 'MQTT'));
    setStep('details');
    setDetails(null);
    setManualDeviceId('');
    setScanError(null);
    setUseCamera(true);
    setRegisteredDeviceId(null);
  };

  const handleOpenChange = (state: boolean) => {
    if (!state) resetAll();
    onOpenChange(state);
  };

  const handleDetailsSubmit = (values: DetailsForm) => {
    setDetails(values);
    setStep('scan');
  };

  const registerWithDeviceId = async (deviceId: string) => {
    if (!details) return;
    const trimmed = deviceId.trim();
    if (!trimmed) return;

    try {
      const result = await registerDevice.mutateAsync({
        deviceId: trimmed,
        templateId: details.templateId,
        name: details.name,
      });
      toast.success('Device added');
      if (result.data) {
        setRegisteredDeviceId(result.data.device.id);
        setStep('config');
      } else {
        handleOpenChange(false);
      }
    } catch {
      // Error toast is already shown by the global mutation error handler (see main.tsx).
    }
  };

  const handleSkipConfig = () => {
    handleOpenChange(false);
  };

  const handleSaveConfig = async (values: DeviceConfigFormValues) => {
    if (!registeredDeviceId) return;

    try {
      await updateDeviceConfig.mutateAsync({
        id: registeredDeviceId,
        data: deviceConfigFormToPayload(values),
      });
      toast.success('Device config saved');
    } catch {
      // Error toast is already shown by the global mutation error handler (see main.tsx).
    }
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 'details' ? (
          <>
            <DialogHeader>
              <DialogTitle>Add Device</DialogTitle>
              <DialogDescription>Choose a template and name your device, then scan its QR code.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form id="device-details-form" onSubmit={form.handleSubmit(handleDetailsSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={templatesLoading}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={templatesLoading ? 'Loading templates...' : 'Select a template'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name} ({getDeviceTemplateTypeLabel(template.type)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Device Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Living Room Sensor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
            <DialogFooter>
              <Button type="submit" form="device-details-form">
                Next: Scan QR Code
              </Button>
            </DialogFooter>
          </>
        ) : step === 'scan' ? (
          <>
            <DialogHeader>
              <DialogTitle>Scan Device QR Code</DialogTitle>
              <DialogDescription>Scan the QR code printed on the physical device, or type its ID manually.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => setUseCamera((v) => !v)}>
                  {useCamera ? (
                    <>
                      <IconKeyboard className="mr-1 h-4 w-4" /> Type ID instead
                    </>
                  ) : (
                    <>
                      <IconCamera className="mr-1 h-4 w-4" /> Use camera instead
                    </>
                  )}
                </Button>
              </div>

              {useCamera ? (
                <div className="overflow-hidden rounded-md border">
                  <QRScanner
                    onScan={(results) => {
                      if (registerDevice.isPending) return;
                      const value = results[0]?.data;
                      if (value) void registerWithDeviceId(value);
                    }}
                    onError={(error) => setScanError(error instanceof Error ? error.message : 'Could not access the camera.')}
                  />
                </div>
              ) : null}

              {scanError && useCamera ? <p className="text-destructive text-sm">{scanError} Use manual entry below instead.</p> : null}

              <div className="space-y-2">
                <Label htmlFor="manual-device-id">Device ID (manual entry)</Label>
                <div className="flex gap-2">
                  <Input
                    id="manual-device-id"
                    placeholder="Enter the device's physical ID"
                    value={manualDeviceId}
                    onChange={(e) => setManualDeviceId(e.target.value)}
                  />
                  <Button
                    type="button"
                    disabled={!manualDeviceId.trim() || registerDevice.isPending}
                    onClick={() => void registerWithDeviceId(manualDeviceId)}
                  >
                    Use this ID
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep('details')} disabled={registerDevice.isPending}>
                Back
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Configure Device (optional)</DialogTitle>
              <DialogDescription>Set the network parameters this device will fetch at boot, or skip and configure later.</DialogDescription>
            </DialogHeader>
            <Form {...configForm}>
              <form id="device-add-config-form" onSubmit={configForm.handleSubmit(handleSaveConfig)} className="space-y-4 p-0.5">
                <DeviceConfigFields control={configForm.control} pushChannel={configPushChannel} />
              </form>
            </Form>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleSkipConfig} disabled={updateDeviceConfig.isPending}>
                Skip
              </Button>
              <Button type="submit" form="device-add-config-form" disabled={updateDeviceConfig.isPending}>
                Save &amp; Finish
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
