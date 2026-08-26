import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import type { DeviceTelemetryEvent } from '../../device/device.service.ts';
import { DeviceService } from '../../device/device.service.ts';
import type { TelemetryFieldDefinition } from '../../device-template/device-template.entity.ts';
import { NotificationService } from '../notification.service.ts';

@Injectable()
export class DeviceWarningListener {
  constructor(
    private readonly deviceService: DeviceService,
    private readonly notificationService: NotificationService,
  ) {}

  @OnEvent('device.telemetry')
  async handleTelemetry(event: DeviceTelemetryEvent): Promise<void> {
    const device = await this.deviceService.findByDeviceIdWithTemplate(event.deviceId);

    if (!device?.template?.telemetrySchema) {
      return;
    }

    for (const field of device.template.telemetrySchema) {
      const value = event.payload[field.key];

      if (typeof value !== 'number') {
        continue;
      }

      const breach = this.checkThreshold(field, value, device.warningOverrides?.[field.key]);

      if (!breach) {
        continue;
      }

      const message = this.buildMessage(device.name, field, value, breach);

      // eslint-disable-next-line no-await-in-loop
      await this.notificationService.sendWarning(device.userId, message);
    }
  }

  private checkThreshold(
    field: TelemetryFieldDefinition,
    value: number,
    override: { min?: number; max?: number; enabled?: boolean } | undefined,
  ): { min?: number; max?: number } | null {
    if (override?.enabled === false) {
      return null;
    }

    const min = override?.min ?? field.warningMin;
    const max = override?.max ?? field.warningMax;

    if (min === undefined && max === undefined) {
      return null;
    }

    if ((min !== undefined && value < min) || (max !== undefined && value > max)) {
      return { min, max };
    }

    return null;
  }

  private buildMessage(deviceName: string, field: TelemetryFieldDefinition, value: number, breach: { min?: number; max?: number }): string {
    const range = [breach.min !== undefined ? `min ${breach.min}` : null, breach.max !== undefined ? `max ${breach.max}` : null]
      .filter(Boolean)
      .join(', ');

    return `[Warning] ${deviceName}: ${field.label} = ${value}${field.unit ?? ''} (expected ${range})`;
  }
}
