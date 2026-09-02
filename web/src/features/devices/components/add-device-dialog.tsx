'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconCamera, IconKeyboard } from '@tabler/icons-react';
import { QRScanner } from '@vkhangstack/veloqr';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDeviceTemplatesQuery, useRegisterDeviceMutation, useUpdateDeviceConfigMutation } from '../api/queries';
import type { IDevice } from '../api/types';
import { getDeviceTemplateTypeLabel } from '../data/data';
import { type DeviceConfigFormValues, deviceConfigFormDefaults, deviceConfigFormSchema, deviceConfigFormToPayload } from '../data/device-config-form';
import { DeviceConfigFields } from './device-config-fields';

function buildDetailsSchema(t: (key: string, options?: Record<string, unknown>) => string) {
  return z.object({
    templateId: z.string().min(1, { message: t('addDialog.templateRequired') }),
    name: z.string().min(1, { message: t('addDialog.nameRequired') }),
  });
}
type DetailsForm = z.infer<ReturnType<typeof buildDetailsSchema>>;

type Step = 'details' | 'scan' | 'config';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDeviceId?: string | null;
}

export function AddDeviceDialog({ open, onOpenChange, initialDeviceId }: Props) {
  const { t } = useTranslation('devices');
  const detailsSchema = useMemo(() => buildDetailsSchema(t), [t]);
  const [step, setStep] = useState<Step>('details');
  const [details, setDetails] = useState<DetailsForm | null>(null);
  const [manualDeviceId, setManualDeviceId] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);
  const [useCamera, setUseCamera] = useState(true);
  const [registeredDevice, setRegisteredDevice] = useState<IDevice | null>(null);

  useEffect(() => {
    if (open && initialDeviceId) {
      setManualDeviceId(initialDeviceId);
      setUseCamera(false);
    }
  }, [open, initialDeviceId]);

  const { data: templatesPage, isLoading: templatesLoading } = useDeviceTemplatesQuery();
  // Inactive templates shouldn't be offered for new devices — the backend rejects
  // registration against one anyway (`error.deviceTemplateInactive`), so filter them
  // out here purely so the dropdown doesn't show a choice that's guaranteed to fail.
  const templates = (templatesPage?.data ?? []).filter((template) => template.isActive);
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
  const configChannelTopics = configForm.watch('channelTopics');

  const resetAll = () => {
    form.reset({ templateId: '', name: '' });
    configForm.reset(deviceConfigFormDefaults(null, 'MQTT'));
    setStep('details');
    setDetails(null);
    setManualDeviceId('');
    setScanError(null);
    setUseCamera(true);
    setRegisteredDevice(null);
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
      toast.success(t('addDialog.deviceAdded'));
      if (result.data) {
        const registered = result.data.device;
        setRegisteredDevice(registered);
        configForm.reset(
          deviceConfigFormDefaults(null, 'MQTT', true, registered.deviceId, registered.template, registered.alertRules, registered.failsafe),
        );
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
    if (!registeredDevice) return;

    try {
      await updateDeviceConfig.mutateAsync({
        id: registeredDevice.id,
        data: deviceConfigFormToPayload(values, registeredDevice.template?.type),
      });
      toast.success(t('addDialog.configSaved'));
      handleOpenChange(false);
    } catch {
      // Error toast is already shown by the global mutation error handler (see main.tsx).
      // Keep the dialog open so the user can fix the config and retry.
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {step === 'details' ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('addDialog.title')}</DialogTitle>
              <DialogDescription>{t('addDialog.description')}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form id="device-details-form" onSubmit={form.handleSubmit(handleDetailsSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="templateId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('addDialog.template')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={templatesLoading}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={templatesLoading ? t('addDialog.loadingTemplates') : t('addDialog.selectTemplate')} />
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
                      <FormLabel>{t('addDialog.deviceName')}</FormLabel>
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
                {t('addDialog.nextScanQrCode')}
              </Button>
            </DialogFooter>
          </>
        ) : step === 'scan' ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('addDialog.scanTitle')}</DialogTitle>
              <DialogDescription>{t('addDialog.scanDescription')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => setUseCamera((v) => !v)}>
                  {useCamera ? (
                    <>
                      <IconKeyboard className="mr-1 h-4 w-4" /> {t('addDialog.typeIdInstead')}
                    </>
                  ) : (
                    <>
                      <IconCamera className="mr-1 h-4 w-4" /> {t('addDialog.useCameraInstead')}
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
                    onError={(error) => setScanError(error instanceof Error ? error.message : t('addDialog.cameraAccessError'))}
                  />
                </div>
              ) : null}

              {scanError && useCamera ? (
                <p className="text-destructive text-sm">
                  {scanError} {t('addDialog.useManualEntry')}
                </p>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="manual-device-id">{t('addDialog.deviceIdManual')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="manual-device-id"
                    placeholder={t('addDialog.deviceIdPlaceholder')}
                    value={manualDeviceId}
                    onChange={(e) => setManualDeviceId(e.target.value)}
                  />
                  <Button
                    type="button"
                    disabled={!manualDeviceId.trim() || registerDevice.isPending}
                    onClick={() => void registerWithDeviceId(manualDeviceId)}
                  >
                    {t('addDialog.useThisId')}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setStep('details')} disabled={registerDevice.isPending}>
                {t('addDialog.back')}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('addDialog.configureTitle')}</DialogTitle>
              <DialogDescription>{t('addDialog.configureDescription')}</DialogDescription>
            </DialogHeader>
            <Form {...configForm}>
              <form id="device-add-config-form" onSubmit={configForm.handleSubmit(handleSaveConfig)} className="space-y-4 p-0.5">
                <DeviceConfigFields
                  control={configForm.control}
                  pushChannel={configPushChannel}
                  channelTopics={configChannelTopics}
                  templateType={registeredDevice?.template?.type}
                />
              </form>
            </Form>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleSkipConfig} disabled={updateDeviceConfig.isPending}>
                {t('addDialog.skip')}
              </Button>
              <Button type="submit" form="device-add-config-form" disabled={updateDeviceConfig.isPending}>
                {t('addDialog.saveAndFinish')}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
