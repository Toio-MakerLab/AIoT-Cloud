import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { DeviceService } from './device.service.ts';

/** Periodically sweeps devices whose last heartbeat is older than the offline threshold. */
@Injectable()
export class DeviceStatusScheduler {
  private readonly logger = new Logger(DeviceStatusScheduler.name);

  constructor(private readonly deviceService: DeviceService) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async sweepOfflineDevices(): Promise<void> {
    try {
      await this.deviceService.sweepOfflineDevices();
    } catch (error) {
      this.logger.error(`Failed to sweep offline devices: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
