import { IconAntenna, IconCpu, IconDeviceUnknown, IconRouter } from '@tabler/icons-react';
import type { DevicePushChannel, DeviceStatus, DeviceTemplateType } from './schema';

export const deviceStatusColors = new Map<DeviceStatus, string>([
  ['ONLINE', 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  ['OFFLINE', 'bg-neutral-300/40 text-neutral-600 border-neutral-300'],
]);

export const devicePushChannels: {
  label: string;
  value: DevicePushChannel;
  disabled?: boolean;
}[] = [
  { label: 'MQTT', value: 'MQTT' },
  { label: 'HTTP POST', value: 'HTTP' },
  { label: 'Apache Kafka', value: 'KAFKA' },
];

export function getDevicePushChannelLabel(channel: DevicePushChannel) {
  return devicePushChannels.find((c) => c.value === channel)?.label ?? channel;
}

export const deviceTemplateTypes: {
  label: string;
  value: DeviceTemplateType;
  icon: typeof IconCpu;
}[] = [
  { label: 'Sensor Node', value: 'SENSOR_NODE', icon: IconCpu },
  { label: 'Relay Node', value: 'RELAY_NODE', icon: IconAntenna },
  { label: 'Gateway', value: 'GATEWAY', icon: IconRouter },
  { label: 'Other', value: 'OTHER', icon: IconDeviceUnknown },
];

export function getDeviceTemplateTypeLabel(type: DeviceTemplateType) {
  return deviceTemplateTypes.find((t) => t.value === type)?.label ?? type;
}
