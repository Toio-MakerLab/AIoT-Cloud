import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import type { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { TokenType } from '../../constants/token-type.ts';
import type { DeviceTelemetryEvent } from '../device/device.service.ts';
import { DeviceService } from '../device/device.service.ts';

interface SocketData {
  userId: string;
}

function deviceRoom(deviceId: string): string {
  return `device:${deviceId}`;
}

@WebSocketGateway({ cors: true })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AppGateway.name);

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly deviceService: DeviceService,
  ) {}

  async handleConnection(client: Socket & { data: SocketData }): Promise<void> {
    const token = (client.handshake.auth?.token as string | undefined) ?? (client.handshake.query?.token as string | undefined);

    if (!token) {
      this.logger.warn(`Client ${client.id} connected without a token, disconnecting`);
      client.disconnect(true);

      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ userId: string; type: TokenType }>(token);

      if (payload.type !== TokenType.ACCESS_TOKEN) {
        throw new Error('Not an access token');
      }

      client.data.userId = payload.userId;
      this.logger.log(`Client connected: ${client.id} (user ${payload.userId})`);
    } catch {
      this.logger.warn(`Client ${client.id} sent an invalid token, disconnecting`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:device')
  async handleSubscribeDevice(client: Socket & { data: SocketData }, deviceId: string): Promise<{ ok: boolean }> {
    const owned = await this.deviceService.isOwnedByUser(client.data.userId as Uuid, deviceId);

    if (!owned) {
      return { ok: false };
    }

    await client.join(deviceRoom(deviceId));

    return { ok: true };
  }

  @SubscribeMessage('ping')
  handlePing(): { pong: true; receivedAt: string } {
    return { pong: true, receivedAt: new Date().toISOString() };
  }

  @OnEvent('device.telemetry')
  handleDeviceTelemetry(event: DeviceTelemetryEvent): void {
    this.server.to(deviceRoom(event.deviceId)).emit('telemetry', event);
  }
}
