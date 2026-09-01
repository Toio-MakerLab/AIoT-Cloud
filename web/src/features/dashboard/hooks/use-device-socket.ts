import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { domainConfig } from '@/lib/domain-config';
import { useAuthStore } from '@/stores/authStore';
import { type ILatestTelemetry, type ITelemetryPoint, TELEMETRY_HISTORY_LIMIT } from './telemetry-types';

export type { ILatestTelemetry, ITelemetryPoint };
export { TELEMETRY_HISTORY_LIMIT };

interface TelemetryEventPayload {
  deviceId: string;
  payload: Record<string, unknown>;
  recordedAt: string;
}

/**
 * Opens a single socket.io connection for the whole dashboard page, subscribes to the given
 * device ids, and fans out incoming `telemetry` events by deviceId. Used for every dashboard
 * panel type (CHART, ACTION, VALUE) — CHART panels used to read from a separate SSE feed
 * (`useDeviceSse`), but that path sat behind reverse-proxy/CDN response buffering in production
 * and never delivered realtime pushes; WebSocket push doesn't have that problem, so all panel
 * types now share this one connection.
 *
 * Exposes:
 * - `latestByDevice`: Map<deviceId, ILatestTelemetry> — most recent telemetry per device.
 * - `historyByDevice`: Map<deviceId, ITelemetryPoint[]> — rolling in-memory buffer (last N
 *   points) per device, seeded from any history passed via `seedHistory` and appended to as
 *   live telemetry arrives.
 * - `seedHistory(deviceId, points)`: merge fetched history (e.g. from
 *   GET /api/devices/:id/telemetry) into the rolling buffer for a device.
 * - `connected`: whether the socket is currently connected.
 */
export function useDeviceSocket(deviceIds: string[]) {
  const socketRef = useRef<Socket | null>(null);
  const subscribedRef = useRef<Set<string>>(new Set());
  const [connected, setConnected] = useState(false);
  const [latestByDevice, setLatestByDevice] = useState<Map<string, ILatestTelemetry>>(new Map());
  const [historyByDevice, setHistoryByDevice] = useState<Map<string, ITelemetryPoint[]>>(new Map());

  const accessToken = useAuthStore((state) => state.auth.accessToken);

  // Connect once (or whenever the access token changes / becomes available).
  useEffect(() => {
    if (!accessToken) {
      return;
    }

    // AppGateway registers on the default namespace ("/") at the default engine.io path
    // ("/socket.io"), independent of Nest's HTTP `setGlobalPrefix('/api')` — so passing
    // VITE_API_URL (e.g. "https://host/api") straight to io() makes socket.io-client treat
    // "/api" as the *namespace* instead of a path, which the server rejects with
    // "Invalid namespace". Strip down to the origin and let socket.io use its own default path.
    const apiUrl = domainConfig.VITE_API_URL || 'http://localhost:3000';
    const origin = (() => {
      try {
        return new URL(apiUrl, window.location.origin).origin;
      } catch {
        return window.location.origin;
      }
    })();
    const socket = io(origin, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => {
      setConnected(false);
      subscribedRef.current.clear();
    };
    const handleTelemetry = (event: TelemetryEventPayload) => {
      setLatestByDevice((prev) => {
        const next = new Map(prev);
        // Backend records/forwards each MQTT telemetry message's payload as-is (device.service.ts
        // recordTelemetry) — a device that reports fields piecemeal across messages (e.g. a
        // gateway sending one relay channel's state per publish) can push a payload that only
        // covers a subset of fields. Merging onto the previous snapshot instead of replacing it
        // keeps every field's last known value; VALUE/ACTION panels read straight off this map, so
        // overwriting wholesale made an untouched field flash to "--" the instant any other field
        // on the same device updated. `historyByDevice` below stays per-message/unmerged on
        // purpose — each history point should reflect exactly what was reported at that instant.
        const previousPayload = prev.get(event.deviceId)?.payload;
        next.set(event.deviceId, {
          deviceId: event.deviceId,
          payload: previousPayload ? { ...previousPayload, ...event.payload } : event.payload,
          recordedAt: event.recordedAt,
        });
        return next;
      });
      setHistoryByDevice((prev) => {
        const next = new Map(prev);
        const existing = next.get(event.deviceId) ?? [];
        const appended = [...existing, { payload: event.payload, recordedAt: event.recordedAt }];
        next.set(event.deviceId, appended.length > TELEMETRY_HISTORY_LIMIT ? appended.slice(appended.length - TELEMETRY_HISTORY_LIMIT) : appended);
        return next;
      });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('telemetry', handleTelemetry);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('telemetry', handleTelemetry);
      socket.disconnect();
      socketRef.current = null;
      subscribedRef.current.clear();
      setConnected(false);
    };
  }, [accessToken]);

  // Re-subscribe whenever the set of distinct device ids changes.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !connected) {
      return;
    }

    for (const deviceId of deviceIds) {
      if (subscribedRef.current.has(deviceId)) {
        continue;
      }
      subscribedRef.current.add(deviceId);
      socket.emit('subscribe:device', deviceId, (ack: { ok: boolean } | undefined) => {
        if (!ack?.ok) {
          // Not owned by this user (or subscription failed) — don't retry.
          subscribedRef.current.delete(deviceId);
        }
      });
    }
  }, [deviceIds, connected]);

  const seedHistory = (deviceId: string, points: ITelemetryPoint[]) => {
    setHistoryByDevice((prev) => {
      if (prev.has(deviceId)) {
        return prev;
      }
      const next = new Map(prev);
      next.set(deviceId, points.length > TELEMETRY_HISTORY_LIMIT ? points.slice(points.length - TELEMETRY_HISTORY_LIMIT) : points);
      return next;
    });
  };

  return { connected, latestByDevice, historyByDevice, seedHistory };
}
