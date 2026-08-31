import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import type { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';

import { RoleType } from '../../constants/role-type.ts';
import { TokenType } from '../../constants/token-type.ts';
import type { DeviceChannelStateEvent, DeviceStatusEvent, DeviceTelemetryEvent } from '../device/device.service.ts';
import { DeviceService } from '../device/device.service.ts';

interface SocketData {
  userId: string;
  role: RoleType;
}

function deviceRoom(deviceId: string): string {
  return `device:${deviceId}`;
}

@WebSocketGateway({ cors: true })
export class AppGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AppGateway.name);

  @WebSocketServer()
  server!: Server;

  // `device.telemetry`/`device.status` events (and the rooms above) are keyed by the device's
  // physical id, but clients subscribe with (and expect payloads keyed by) the entity id. This
  // cache is populated on subscribe and used to remap outgoing event payloads back to entity ids.
  private readonly physicalToEntityId = new Map<string, string>();

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
      const payload = await this.jwtService.verifyAsync<{ userId: string; role: RoleType; type: TokenType }>(token);

      if (payload.type !== TokenType.ACCESS_TOKEN) {
        throw new Error('Not an access token');
      }

      client.data.userId = payload.userId;
      client.data.role = payload.role;
      this.logger.log(`Client connected: ${client.id} (user ${payload.userId})`);
    } catch {
      this.logger.warn(`Client ${client.id} sent an invalid token, disconnecting`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * `entityId` is the entity id the dashboard widgets key on (same id the REST endpoints use).
   * GUEST clients subscribe unrestricted — they can see every device system-wide.
   */
  @SubscribeMessage('subscribe:device')
  async handleSubscribeDevice(client: Socket & { data: SocketData }, entityId: string): Promise<{ ok: boolean }> {
    const ownerId = client.data.role === RoleType.GUEST ? null : (client.data.userId as string);
    const device = await this.deviceService.resolveOwnedDeviceByEntityId(ownerId, entityId);

    if (!device) {
      return { ok: false };
    }

    this.physicalToEntityId.set(device.deviceId, device.id);
    await client.join(deviceRoom(device.deviceId));

    return { ok: true };
  }

  @SubscribeMessage('ping')
  handlePing(): { pong: true; receivedAt: string } {
    return { pong: true, receivedAt: new Date().toISOString() };
  }

  @OnEvent('device.telemetry')
  handleDeviceTelemetry(event: DeviceTelemetryEvent): void {
    const deviceId = this.physicalToEntityId.get(event.deviceId) ?? event.deviceId;
    this.server.to(deviceRoom(event.deviceId)).emit('telemetry', { ...event, deviceId });
  }

  @OnEvent('device.status')
  handleDeviceStatus(event: DeviceStatusEvent): void {
    const deviceId = this.physicalToEntityId.get(event.deviceId) ?? event.deviceId;
    this.server.to(deviceRoom(event.deviceId)).emit('status', { ...event, deviceId });
  }

  @OnEvent('device.channelState')
  handleDeviceChannelState(event: DeviceChannelStateEvent): void {
    const deviceId = this.physicalToEntityId.get(event.deviceId) ?? event.deviceId;
    this.server.to(deviceRoom(event.deviceId)).emit('channelState', { ...event, deviceId });
  }
}
