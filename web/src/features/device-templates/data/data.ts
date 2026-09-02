import { IconBolt, IconCpu, IconDeviceUnknown, IconRouter, IconServer2 } from '@tabler/icons-react';
import type { DeviceTemplateType } from './schema';

// Icon-only lookup — labels are translated separately via `getDeviceTemplateTypes`/
// `getDeviceTemplateTypeLabel` below (both take a `t`), so this stays free of i18n.
const DEVICE_TEMPLATE_TYPE_ICONS: Record<DeviceTemplateType, typeof IconCpu> = {
  SENSOR_NODE: IconCpu,
  RELAY_NODE: IconRouter,
  RELAY_CURRENT_NODE: IconBolt,
  GATEWAY: IconServer2,
  OTHER: IconDeviceUnknown,
};

export function getDeviceTemplateTypes(t: (key: string, options?: Record<string, unknown>) => string) {
  return [
    { label: t('types.sensorNode'), value: 'SENSOR_NODE' as const, icon: IconCpu },
    { label: t('types.relayNode'), value: 'RELAY_NODE' as const, icon: IconRouter },
    { label: t('types.relayCurrentNode'), value: 'RELAY_CURRENT_NODE' as const, icon: IconBolt },
    { label: t('types.gateway'), value: 'GATEWAY' as const, icon: IconServer2 },
    { label: t('types.other'), value: 'OTHER' as const, icon: IconDeviceUnknown },
  ];
}

// `t` here is the `common` namespace's translate function (not `deviceTemplates`'s) — see call sites.
export function getActiveStatuses(t: (key: string, options?: Record<string, unknown>) => string) {
  return [
    { label: t('words.active'), value: 'active' as const },
    { label: t('words.inactive'), value: 'inactive' as const },
  ];
}

export const activeBadgeClasses = new Map<boolean, string>([
  [true, 'bg-teal-100/30 text-teal-900 dark:text-teal-200 border-teal-200'],
  [false, 'bg-neutral-300/40 border-neutral-300'],
]);

export function getDeviceTemplateTypeMeta(type: DeviceTemplateType) {
  return { value: type, icon: DEVICE_TEMPLATE_TYPE_ICONS[type] ?? IconDeviceUnknown };
}

export function getDeviceTemplateTypeLabel(type: DeviceTemplateType, t: (key: string, options?: Record<string, unknown>) => string) {
  return getDeviceTemplateTypes(t).find((entry) => entry.value === type)?.label ?? type;
}
