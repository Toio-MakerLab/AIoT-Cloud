import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.ts';
import { DeviceModule } from '../device/device.module.ts';
import { AppGateway } from './app.gateway.ts';

@Module({
  imports: [AuthModule, DeviceModule],
  providers: [AppGateway],
})
export class WebsocketModule {}
