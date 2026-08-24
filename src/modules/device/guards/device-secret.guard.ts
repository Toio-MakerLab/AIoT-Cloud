import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { DeviceService } from '../device.service.ts';

@Injectable()
export class DeviceSecretGuard implements CanActivate {
  constructor(private deviceService: DeviceService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const deviceId: string | undefined = request.params.deviceId;
    const secret = request.headers['x-device-secret'];

    if (!deviceId || typeof secret !== 'string' || !secret) {
      throw new UnauthorizedException();
    }

    const device = await this.deviceService.verifyDeviceSecret(deviceId, secret);

    if (!device) {
      throw new UnauthorizedException();
    }

    request.device = device;

    return true;
  }
}
