import type { MqttContext } from '@nestjs/microservices';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';

import { DeviceService } from '../device/device.service.ts';
import { MqttController } from './mqtt.controller.ts';
import { MqttTopicRegistryService } from './mqtt-topic-registry.service.ts';

/** Waits out every pending microtask (and one macrotask) so fire-and-forget `void` calls in `handleAny` settle before assertions. */
const flush = (): Promise<void> => new Promise((resolve) => setImmediate(resolve));

const contextFor = (topic: string): MqttContext => ({ getTopic: () => topic }) as unknown as MqttContext;

describe('MqttController', () => {
  let controller: MqttController;
  let deviceService: {
    recordTelemetry: jest.Mock;
    handleDeviceStatusMessage: jest.Mock;
    handleDeviceChannelEvent: jest.Mock;
    resolveCustomMqttTopic: jest.Mock;
  };
  let topicRegistry: {
    get: jest.Mock;
    isRecentMiss: jest.Mock;
    recordHit: jest.Mock;
    recordMiss: jest.Mock;
    clear: jest.Mock;
  };

  beforeEach(async () => {
    deviceService = {
      recordTelemetry: jest.fn().mockResolvedValue(undefined),
      handleDeviceStatusMessage: jest.fn().mockResolvedValue(undefined),
      handleDeviceChannelEvent: jest.fn().mockResolvedValue(undefined),
      resolveCustomMqttTopic: jest.fn(),
    };
    topicRegistry = {
      get: jest.fn().mockReturnValue(undefined),
      isRecentMiss: jest.fn().mockReturnValue(false),
      recordHit: jest.fn(),
      recordMiss: jest.fn(),
      clear: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MqttController],
      providers: [
        { provide: DeviceService, useValue: deviceService },
        { provide: MqttTopicRegistryService, useValue: topicRegistry },
      ],
    }).compile();

    controller = module.get<MqttController>(MqttController);
  });

  describe('ping', () => {
    it('echoes the payload back with a pong flag and timestamp', () => {
      const result = controller.ping({ hello: 'world' });

      expect(result.pong).toBe(true);
      expect(result.data).toEqual({ hello: 'world' });
      expect(typeof result.receivedAt).toBe('string');
    });
  });

  describe('handleAny', () => {
    describe('default-shape topics', () => {
      it('routes a telemetry topic to DeviceService.recordTelemetry', async () => {
        const data = { temp: 21 };

        controller.handleAny(data, contextFor('devices/dev-1/telemetry'));
        await flush();

        expect(deviceService.recordTelemetry).toHaveBeenCalledWith('dev-1', data);
        expect(topicRegistry.get).not.toHaveBeenCalled();
      });

      it('routes a status topic to DeviceService.handleDeviceStatusMessage', async () => {
        const data = { status: 'ONLINE' };

        controller.handleAny(data, contextFor('devices/dev-2/status'));
        await flush();

        expect(deviceService.handleDeviceStatusMessage).toHaveBeenCalledWith('dev-2', data);
      });

      it('routes an event topic to DeviceService.handleDeviceChannelEvent', async () => {
        const data = { key: 'relay1', value: 'ON', status: 'ok' };

        controller.handleAny(data, contextFor('devices/dev-3/event'));
        await flush();

        expect(deviceService.handleDeviceChannelEvent).toHaveBeenCalledWith('dev-3', data);
      });

      it('ignores a command topic (broker echo of our own downlink publish)', async () => {
        controller.handleAny({ key: 'relay1', value: 'ON' }, contextFor('devices/dev-4/command'));
        await flush();

        expect(deviceService.recordTelemetry).not.toHaveBeenCalled();
        expect(deviceService.handleDeviceStatusMessage).not.toHaveBeenCalled();
        expect(deviceService.handleDeviceChannelEvent).not.toHaveBeenCalled();
        expect(deviceService.resolveCustomMqttTopic).not.toHaveBeenCalled();
      });

      it('ignores a per-channel command topic', async () => {
        controller.handleAny({ value: 'OFF' }, contextFor('devices/dev-5/channel/2/command'));
        await flush();

        expect(deviceService.resolveCustomMqttTopic).not.toHaveBeenCalled();
      });
    });

    describe('custom (non-default-shape) topics', () => {
      const topic = 'factory1/line2/relay/data';

      it('dispatches a cached telemetry hit without touching the DB', async () => {
        topicRegistry.get.mockReturnValue({ deviceId: 'dev-6', role: 'telemetry' });
        const data = { amps: 1.2 };

        controller.handleAny(data, contextFor(topic));
        await flush();

        expect(deviceService.recordTelemetry).toHaveBeenCalledWith('dev-6', data);
        expect(deviceService.resolveCustomMqttTopic).not.toHaveBeenCalled();
      });

      it('dispatches a cached status hit without touching the DB', async () => {
        topicRegistry.get.mockReturnValue({ deviceId: 'dev-7', role: 'status' });
        const data = { status: 'OFFLINE' };

        controller.handleAny(data, contextFor(topic));
        await flush();

        expect(deviceService.handleDeviceStatusMessage).toHaveBeenCalledWith('dev-7', data);
        expect(deviceService.resolveCustomMqttTopic).not.toHaveBeenCalled();
      });

      it('dispatches a cached event hit without touching the DB', async () => {
        topicRegistry.get.mockReturnValue({ deviceId: 'dev-8', role: 'event' });
        const data = { key: 'relay1', status: 'ok' };

        controller.handleAny(data, contextFor(topic));
        await flush();

        expect(deviceService.handleDeviceChannelEvent).toHaveBeenCalledWith('dev-8', data);
        expect(deviceService.resolveCustomMqttTopic).not.toHaveBeenCalled();
      });

      it('does nothing for a cached command hit (downlink echo)', async () => {
        topicRegistry.get.mockReturnValue({ deviceId: 'dev-9', role: 'command' });

        controller.handleAny({ value: 'ON' }, contextFor(topic));
        await flush();

        expect(deviceService.recordTelemetry).not.toHaveBeenCalled();
        expect(deviceService.handleDeviceStatusMessage).not.toHaveBeenCalled();
        expect(deviceService.handleDeviceChannelEvent).not.toHaveBeenCalled();
        expect(deviceService.resolveCustomMqttTopic).not.toHaveBeenCalled();
      });

      it('skips the DB for a topic cached as a recent miss', async () => {
        topicRegistry.isRecentMiss.mockReturnValue(true);

        controller.handleAny({}, contextFor(topic));
        await flush();

        expect(deviceService.resolveCustomMqttTopic).not.toHaveBeenCalled();
        expect(topicRegistry.recordMiss).not.toHaveBeenCalled();
      });

      it('resolves, caches, and dispatches an uncached topic that matches a device override', async () => {
        deviceService.resolveCustomMqttTopic.mockResolvedValue({ deviceId: 'dev-10', role: 'telemetry' });
        const data = { pressure: 1013 };

        controller.handleAny(data, contextFor(topic));
        await flush();

        expect(deviceService.resolveCustomMqttTopic).toHaveBeenCalledWith(topic);
        expect(topicRegistry.recordHit).toHaveBeenCalledWith(topic, { deviceId: 'dev-10', role: 'telemetry' });
        expect(deviceService.recordTelemetry).toHaveBeenCalledWith('dev-10', data);
        expect(topicRegistry.recordMiss).not.toHaveBeenCalled();
      });

      it('records a miss and dispatches nothing for a topic unrelated to any device', async () => {
        deviceService.resolveCustomMqttTopic.mockResolvedValue(null);

        controller.handleAny({}, contextFor(topic));
        await flush();

        expect(topicRegistry.recordMiss).toHaveBeenCalledWith(topic);
        expect(topicRegistry.recordHit).not.toHaveBeenCalled();
        expect(deviceService.recordTelemetry).not.toHaveBeenCalled();
        expect(deviceService.handleDeviceStatusMessage).not.toHaveBeenCalled();
        expect(deviceService.handleDeviceChannelEvent).not.toHaveBeenCalled();
      });
    });
  });
});
