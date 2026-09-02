import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { DeviceLifecycleService } from './device-lifecycle.service.ts';

/** Keeps every device's persisted lifecycle stage/score fresh so list views can show it without recomputing on read. */
@Injectable()
export class DeviceLifecycleScheduler {
  private readonly logger = new Logger(DeviceLifecycleScheduler.name);

  constructor(private readonly deviceLifecycleService: DeviceLifecycleService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async assessAllDevices(): Promise<void> {
    try {
      await this.deviceLifecycleService.assessAllDevices();
    } catch (error) {
      this.logger.error(`Failed to run scheduled lifecycle assessment: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
