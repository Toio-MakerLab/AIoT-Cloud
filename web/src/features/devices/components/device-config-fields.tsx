import type { Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { PasswordInput } from '@/components/password-input';
import { SelectDropdown } from '@/components/select-dropdown';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { devicePushChannels } from '../data/data';
import type { DeviceConfigFormValues } from '../data/device-config-form';
import type { DeviceTemplateType } from '../data/schema';

interface Props {
  control: Control<DeviceConfigFormValues>;
  pushChannel: DeviceConfigFormValues['pushChannel'];
  channelTopics: DeviceConfigFormValues['channelTopics'];
  /** Gates the GATEWAY-only local automation fields below — undefined (e.g. still registering) hides them. */
  templateType?: DeviceTemplateType;
}

export function DeviceConfigFields({ control, pushChannel, channelTopics, templateType }: Props) {
  const { t } = useTranslation('devices');
  return (
    <>
      <FormField
        control={control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>{t('configFields.active')}</FormLabel>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="apiEndpoint"
        render={({ field }) => (
          <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
            <FormLabel className="col-span-2 text-right">{t('configFields.apiEndpoint')}</FormLabel>
            <FormControl className="col-span-4">
              <Input placeholder="https://api.example.com" {...field} />
            </FormControl>
            <FormMessage className="col-span-4 col-start-3" />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="pushChannel"
        render={({ field }) => (
          <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
            <FormLabel className="col-span-2 text-right">{t('configFields.pushChannel')}</FormLabel>
            <SelectDropdown
              defaultValue={field.value}
              onValueChange={field.onChange}
              placeholder={t('configFields.selectChannel')}
              className="col-span-4"
              items={devicePushChannels.map(({ label, value }) => ({
                label,
                value,
              }))}
            />
            <FormMessage className="col-span-4 col-start-3" />
          </FormItem>
        )}
      />

      {pushChannel === 'MQTT' ? (
        <>
          <FormField
            control={control}
            name="mqttBroker"
            render={({ field }) => (
              <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                <FormLabel className="col-span-2 text-right">{t('configFields.broker')}</FormLabel>
                <FormControl className="col-span-4">
                  <Input placeholder="mqtt://broker.example.com" {...field} />
                </FormControl>
                <FormMessage className="col-span-4 col-start-3" />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="mqttPort"
            render={({ field }) => (
              <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                <FormLabel className="col-span-2 text-right">{t('configFields.port')}</FormLabel>
                <FormControl className="col-span-4">
                  <Input placeholder="1883" {...field} />
                </FormControl>
                <FormMessage className="col-span-4 col-start-3" />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="mqttUsername"
            render={({ field }) => (
              <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                <FormLabel className="col-span-2 text-right">{t('configFields.username')}</FormLabel>
                <FormControl className="col-span-4">
                  <Input {...field} />
                </FormControl>
                <FormMessage className="col-span-4 col-start-3" />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="mqttPassword"
            render={({ field }) => (
              <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                <FormLabel className="col-span-2 text-right">{t('configFields.password')}</FormLabel>
                <FormControl className="col-span-4">
                  <PasswordInput {...field} />
                </FormControl>
                <FormMessage className="col-span-4 col-start-3" />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="mqttTelemetryTopic"
            render={({ field }) => (
              <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                <FormLabel className="col-span-2 text-right">{t('configFields.telemetryTopic')}</FormLabel>
                <FormControl className="col-span-4">
                  <Input placeholder="devices/{deviceId}/telemetry" {...field} />
                </FormControl>
                <FormMessage className="col-span-4 col-start-3" />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="mqttCommandTopic"
            render={({ field }) => (
              <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                <FormLabel className="col-span-2 text-right">{t('configFields.commandTopic')}</FormLabel>
                <FormControl className="col-span-4">
                  <Input placeholder="devices/{deviceId}/command" {...field} />
                </FormControl>
                <FormMessage className="col-span-4 col-start-3" />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="mqttStatusTopic"
            render={({ field }) => (
              <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                <FormLabel className="col-span-2 text-right">{t('configFields.statusTopic')}</FormLabel>
                <FormControl className="col-span-4">
                  <Input placeholder="devices/{deviceId}/status" {...field} />
                </FormControl>
                <FormMessage className="col-span-4 col-start-3" />
              </FormItem>
            )}
          />

          {/* One command topic per action in the device template's actionSchema (e.g. one per relay). */}
          {channelTopics?.map((channel, index) => (
            <FormField
              key={channel.key}
              control={control}
              name={`channelTopics.${index}.topic`}
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                  <FormLabel className="col-span-2 text-right">
                    {t('configFields.channelLabel', { index: index + 1, label: channel.label })}
                  </FormLabel>
                  <FormControl className="col-span-4">
                    <Input placeholder={`devices/{deviceId}/channel/${index + 1}/command`} {...field} />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
          ))}
        </>
      ) : null}

      {pushChannel === 'HTTP' ? (
        <FormField
          control={control}
          name="httpUrl"
          render={({ field }) => (
            <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
              <FormLabel className="col-span-2 text-right">{t('configFields.pushUrl')}</FormLabel>
              <FormControl className="col-span-4">
                <Input placeholder="https://example.com/ingest" {...field} />
              </FormControl>
              <FormMessage className="col-span-4 col-start-3" />
            </FormItem>
          )}
        />
      ) : null}

      {pushChannel === 'KAFKA' ? (
        <>
          <FormField
            control={control}
            name="kafkaBrokers"
            render={({ field }) => (
              <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                <FormLabel className="col-span-2 text-right">{t('configFields.brokers')}</FormLabel>
                <FormControl className="col-span-4">
                  <Input placeholder="broker1:9092,broker2:9092" {...field} />
                </FormControl>
                <FormMessage className="col-span-4 col-start-3" />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="kafkaTopics"
            render={({ field }) => (
              <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                <FormLabel className="col-span-2 text-right">{t('configFields.topics')}</FormLabel>
                <FormControl className="col-span-4">
                  <Input placeholder="devices.telemetry, devices.status" {...field} />
                </FormControl>
                <FormMessage className="col-span-4 col-start-3" />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="kafkaCommandTopic"
            render={({ field }) => (
              <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                <FormLabel className="col-span-2 text-right">{t('configFields.commandTopic')}</FormLabel>
                <FormControl className="col-span-4">
                  <Input placeholder="devices.commands" {...field} />
                </FormControl>
                <FormMessage className="col-span-4 col-start-3" />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="kafkaClientId"
            render={({ field }) => (
              <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                <FormLabel className="col-span-2 text-right">{t('configFields.clientId')}</FormLabel>
                <FormControl className="col-span-4">
                  <Input {...field} />
                </FormControl>
                <FormMessage className="col-span-4 col-start-3" />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="kafkaUsername"
            render={({ field }) => (
              <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                <FormLabel className="col-span-2 text-right">{t('configFields.username')}</FormLabel>
                <FormControl className="col-span-4">
                  <Input {...field} />
                </FormControl>
                <FormMessage className="col-span-4 col-start-3" />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="kafkaPassword"
            render={({ field }) => (
              <FormItem className="grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0">
                <FormLabel className="col-span-2 text-right">{t('configFields.password')}</FormLabel>
                <FormControl className="col-span-4">
                  <PasswordInput {...field} />
                </FormControl>
                <FormMessage className="col-span-4 col-start-3" />
              </FormItem>
            )}
          />
        </>
      ) : null}

      {templateType === 'GATEWAY' ? (
        <>
          <FormField
            control={control}
            name="alertRules"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-muted-foreground text-xs">{t('configFields.alertRulesLabel')}</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder="amps.value>10:relay_2=OFF" className="font-mono text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="failsafeEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>{t('configFields.failsafe')}</FormLabel>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="failsafeRules"
            render={({ field }) => (
              <FormItem className="space-y-1.5">
                <FormLabel className="text-muted-foreground text-xs">{t('configFields.failsafeRulesLabel')}</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="relay_2=OFF" className="font-mono text-sm" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      ) : null}
    </>
  );
}
