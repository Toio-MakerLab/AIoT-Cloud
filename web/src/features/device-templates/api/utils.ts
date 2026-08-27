import { type DeviceTemplate, deviceTemplateTypeSchema } from '../data/schema';
import type { IDeviceTemplate } from './types';

export function mapIDeviceTemplateToDeviceTemplate(t: IDeviceTemplate): DeviceTemplate {
  return {
    id: t.id,
    name: t.name,
    type: deviceTemplateTypeSchema.parse(t.type),
    description: t.description,
    manufacturer: t.manufacturer,
    telemetrySchema: t.telemetrySchema,
    actionSchema: t.actionSchema,
    icon: t.icon,
    isActive: t.isActive,
    createdAt: new Date(t.createdAt),
    updatedAt: new Date(t.updatedAt),
  };
}
