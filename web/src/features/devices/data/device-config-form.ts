import { z } from 'zod';
import type { IUpdateDeviceConfig } from '../api/types';
import { defaultChannelCommandTopic, defaultCommandTopic, defaultStatusTopic, defaultTelemetryTopic } from './mqtt-topics';
import type { DeviceNetworkConfig, DevicePushChannel, DeviceTemplateType, MqttChannelTopic } from './schema';

/** Templates whose `actionSchema` describes one physical channel per action (e.g. a relay per entry). */
const CHANNEL_BASED_TEMPLATE_TYPES: DeviceTemplateType[] = ['RELAY_NODE', 'RELAY_CURRENT_NODE'];

/** Minimal template shape needed to derive per-channel topic defaults — mirrors device-templates' `actionSchema`. */
export interface DeviceConfigFormTemplate {
  type: DeviceTemplateType;
  actionSchema?: { key: string; label: string }[] | null;
}

const channelTopicFormSchema = z.object({
  key: z.string(),
  label: z.string(),
  topic: z.string().min(1, { message: 'Topic is required.' }),
});
export type ChannelTopicFormValue = z.infer<typeof channelTopicFormSchema>;

const deviceConfigFormObjectSchema = z.object({
  isActive: z.boolean(),
  apiEndpoint: z.string().optional(),
  pushChannel: z.union([z.literal('MQTT'), z.literal('HTTP'), z.literal('KAFKA')]),
  mqttBroker: z.string().optional(),
  mqttPort: z.string().optional(),
  mqttUsername: z.string().optional(),
  mqttPassword: z.string().optional(),
  mqttTelemetryTopic: z.string().optional(),
  mqttCommandTopic: z.string().optional(),
  mqttStatusTopic: z.string().optional(),
  /** One entry per action in the device template's `actionSchema`; only populated for channel-based templates (e.g. relay nodes). */
  channelTopics: z.array(channelTopicFormSchema).optional(),
  httpUrl: z.string().optional(),
  kafkaBrokers: z.string().optional(),
  /** Comma-separated list of topics (e.g. "devices.telemetry, devices.status") — split into an array on submit. */
  kafkaTopics: z.string().optional(),
  /** Topic the cloud sends events/commands down to this device on — only meaningful for gateways. */
  kafkaCommandTopic: z.string().optional(),
  kafkaClientId: z.string().optional(),
  kafkaUsername: z.string().optional(),
  kafkaPassword: z.string().optional(),
});

/**
 * Most fields above stay `.optional()` at the object level because only the fields for the
 * currently selected `pushChannel` are actually required — this refinement enforces that
 * conditional requiredness and attaches the error to the specific field so `FormMessage`
 * renders it inline instead of the field silently accepting an empty value.
 */
export const deviceConfigFormSchema = deviceConfigFormObjectSchema.superRefine((values, ctx) => {
  const requireField = (value: string | undefined, path: string) => {
    if (!value?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'This field is required.', path: [path] });
    }
  };

  if (values.pushChannel === 'MQTT') {
    requireField(values.mqttBroker, 'mqttBroker');
    requireField(values.mqttPort, 'mqttPort');
    requireField(values.mqttTelemetryTopic, 'mqttTelemetryTopic');
  }

  if (values.pushChannel === 'HTTP') {
    requireField(values.httpUrl, 'httpUrl');
  }

  if (values.pushChannel === 'KAFKA') {
    requireField(values.kafkaBrokers, 'kafkaBrokers');
    requireField(values.kafkaTopics, 'kafkaTopics');
  }
});
export type DeviceConfigFormValues = z.infer<typeof deviceConfigFormSchema>;

/**
 * Builds one form row per action in the template's `actionSchema`, keeping any topic already
 * stored for that key and falling back to the same `devices/{deviceId}/channel/{n}/command`
 * default the backend would derive at boot time — see src/constants/mqtt-topics.ts.
 */
function buildChannelTopicDefaults(
  deviceId: string | null | undefined,
  template: DeviceConfigFormTemplate | null | undefined,
  existingChannels: MqttChannelTopic[] | null | undefined,
): ChannelTopicFormValue[] {
  const actionSchema = template?.actionSchema;

  if (!template || !CHANNEL_BASED_TEMPLATE_TYPES.includes(template.type) || !actionSchema?.length) {
    return [];
  }

  const existingTopicByKey = new Map((existingChannels ?? []).map((channel) => [channel.key, channel.topic]));

  return actionSchema.map((action, index) => ({
    key: action.key,
    label: action.label,
    topic: existingTopicByKey.get(action.key) || (deviceId ? defaultChannelCommandTopic(deviceId, index + 1) : ''),
  }));
}

export function deviceConfigFormDefaults(
  config: DeviceNetworkConfig | null | undefined,
  pushChannel: DevicePushChannel,
  isActive = true,
  deviceId?: string | null,
  template?: DeviceConfigFormTemplate | null,
): DeviceConfigFormValues {
  return {
    isActive,
    apiEndpoint: config?.apiEndpoint ?? '',
    pushChannel,
    mqttBroker: config?.mqtt?.broker ?? '',
    mqttPort: config?.mqtt?.port ? String(config.mqtt.port) : '1883',
    mqttUsername: config?.mqtt?.username ?? '',
    mqttPassword: config?.mqtt?.password ?? '',
    mqttTelemetryTopic: config?.mqtt?.topics?.telemetry ?? (deviceId ? defaultTelemetryTopic(deviceId) : ''),
    mqttCommandTopic: config?.mqtt?.topics?.command ?? (deviceId ? defaultCommandTopic(deviceId) : ''),
    mqttStatusTopic: config?.mqtt?.topics?.status ?? (deviceId ? defaultStatusTopic(deviceId) : ''),
    channelTopics: buildChannelTopicDefaults(deviceId, template, config?.mqtt?.topics?.channels),
    httpUrl: config?.http?.url ?? '',
    kafkaBrokers: config?.kafka?.brokers ?? 'localhost:9092',
    kafkaTopics: config?.kafka?.topics?.join(', ') ?? '',
    kafkaCommandTopic: config?.kafka?.commandTopic ?? '',
    kafkaClientId: config?.kafka?.clientId ?? '',
    kafkaUsername: config?.kafka?.username ?? '',
    kafkaPassword: config?.kafka?.password ?? '',
  };
}

export function deviceConfigFormToPayload(values: DeviceConfigFormValues): IUpdateDeviceConfig {
  const channels = values.channelTopics?.length
    ? values.channelTopics.map((channel, index) => ({
        index: index + 1,
        key: channel.key,
        label: channel.label,
        topic: channel.topic,
      }))
    : undefined;

  return {
    isActive: values.isActive,
    apiEndpoint: values.apiEndpoint || undefined,
    pushChannel: values.pushChannel,
    mqtt:
      values.pushChannel === 'MQTT'
        ? {
            broker: values.mqttBroker ?? '',
            port: Number(values.mqttPort) || 1883,
            username: values.mqttUsername || undefined,
            password: values.mqttPassword || undefined,
            topics: {
              telemetry: values.mqttTelemetryTopic ?? '',
              command: values.mqttCommandTopic || undefined,
              status: values.mqttStatusTopic || undefined,
              channels,
            },
          }
        : undefined,
    http: values.pushChannel === 'HTTP' ? { url: values.httpUrl ?? '' } : undefined,
    kafka:
      values.pushChannel === 'KAFKA'
        ? {
            brokers: values.kafkaBrokers ?? '',
            topics: (values.kafkaTopics ?? '')
              .split(',')
              .map((topic) => topic.trim())
              .filter(Boolean),
            commandTopic: values.kafkaCommandTopic || undefined,
            clientId: values.kafkaClientId || undefined,
            username: values.kafkaUsername || undefined,
            password: values.kafkaPassword || undefined,
          }
        : undefined,
  };
}
