import { Module } from '@nestjs/common';

import { AppGateway } from './app.gateway.ts';

@Module({
  providers: [AppGateway],
})
export class WebsocketModule {}
