import { type Device, deviceStatusSchema, deviceTemplateTypeSchema } from '../data/schema';
import type { IDevice } from './types';

export function mapIDeviceToDevice(d: IDevice): Device {
  return {
    id: d.id,
    deviceId: d.deviceId,
    name: d.name,
    templateId: d.templateId,
    template: d.template
      ? {
          id: d.template.id,
          name: d.template.name,
          type: deviceTemplateTypeSchema.parse(d.template.type),
          icon: d.template.icon,
        }
      : undefined,
    userId: d.userId,
    lastSeenAt: d.lastSeenAt ? new Date(d.lastSeenAt) : null,
    status: deviceStatusSchema.catch('OFFLINE').parse(d.status),
    pushChannel: d.pushChannel,
    config: d.config,
    isActive: d.isActive,
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.updatedAt),
  };
}
