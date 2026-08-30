import { z } from 'zod';

export const deviceStatusSchema = z.union([z.literal('ONLINE'), z.literal('OFFLINE')]);
export type DeviceStatus = z.infer<typeof deviceStatusSchema>;

export const deviceTemplateTypeSchema = z.union([
  z.literal('SENSOR_NODE'),
  z.literal('RELAY_NODE'),
  z.literal('RELAY_CURRENT_NODE'),
  z.literal('GATEWAY'),
  z.literal('OTHER'),
]);
export type DeviceTemplateType = z.infer<typeof deviceTemplateTypeSchema>;

export const devicePushChannelSchema = z.union([z.literal('MQTT'), z.literal('HTTP'), z.literal('KAFKA')]);
export type DevicePushChannel = z.infer<typeof devicePushChannelSchema>;

const mqttChannelTopicSchema = z.object({
  index: z.number(),
  key: z.string(),
  label: z.string(),
  topic: z.string(),
});
export type MqttChannelTopic = z.infer<typeof mqttChannelTopicSchema>;

const mqttTopicsSchema = z.object({
  telemetry: z.string(),
  command: z.string().nullish(),
  status: z.string().nullish(),
  channels: z.array(mqttChannelTopicSchema).nullish(),
});
export type MqttTopics = z.infer<typeof mqttTopicsSchema>;

const mqttConfigSchema = z.object({
  broker: z.string(),
  port: z.number(),
  username: z.string().nullish(),
  password: z.string().nullish(),
  topics: mqttTopicsSchema,
});
export type MqttConfig = z.infer<typeof mqttConfigSchema>;

const httpPushConfigSchema = z.object({
  url: z.string(),
  headers: z.record(z.string(), z.string()).nullish(),
});
export type HttpPushConfig = z.infer<typeof httpPushConfigSchema>;

const kafkaConfigSchema = z.object({
  brokers: z.string(),
  topics: z.array(z.string()),
  clientId: z.string().nullish(),
  username: z.string().nullish(),
  password: z.string().nullish(),
});
export type KafkaConfig = z.infer<typeof kafkaConfigSchema>;

const deviceNetworkConfigSchema = z.object({
  apiEndpoint: z.string().nullish(),
  mqtt: mqttConfigSchema.nullish(),
  http: httpPushConfigSchema.nullish(),
  kafka: kafkaConfigSchema.nullish(),
});
export type DeviceNetworkConfig = z.infer<typeof deviceNetworkConfigSchema>;

// Values match backend `DeviceActionType` enum exactly (src/constants/device-action-type.ts).
// Minimal mirror kept self-contained here — same convention as the device-templates feature's
// own copy — since only `key`/`label` are needed to drive the per-channel topic inputs below.
const actionFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.union([z.literal('TOGGLE'), z.literal('BUTTON')]),
  onValue: z.string().nullish(),
  offValue: z.string().nullish(),
});
export type ActionField = z.infer<typeof actionFieldSchema>;

const deviceTemplateSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: deviceTemplateTypeSchema,
  icon: z.string().nullish(),
  actionSchema: z.array(actionFieldSchema).nullish(),
});
export type DeviceTemplateSummary = z.infer<typeof deviceTemplateSummarySchema>;

const deviceSchema = z.object({
  id: z.string(),
  deviceId: z.string(),
  name: z.string(),
  templateId: z.string(),
  template: deviceTemplateSummarySchema.optional(),
  userId: z.string(),
  lastSeenAt: z.coerce.date().nullish(),
  status: deviceStatusSchema,
  pushChannel: devicePushChannelSchema,
  config: deviceNetworkConfigSchema.nullish(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Device = z.infer<typeof deviceSchema>;

export const deviceListSchema = z.array(deviceSchema);
