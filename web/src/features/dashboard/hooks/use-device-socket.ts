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

// Mirrors backend `DeviceChannelStateEvent` (see app.gateway.ts) — the gateway's confirmation
// that a `devices.commands` actuator command actually landed on the device, as opposed to a
// periodic telemetry sample. `channelStates` is the device's full accumulated map (every channel
// reported so far, not just the one that just changed).
interface ChannelStateEventPayload {
  deviceId: string;
  channelStates: Record<string, string>;
  changedAt: string;
}

// Mirrors backend `DeviceActionResultEvent` — a point-in-time result for one channel command,
// dispatched whether it succeeded or failed. Distinct from `channelState` above (persisted state,
// success only): an ACTION panel uses this to resolve its own optimistic value immediately,
// success or failure alike, instead of waiting out its own confirmation timeout.
export interface ActionResultEventPayload {
  deviceId: string;
  key: string;
  value?: string;
  status: 'ok' | 'error';
  error?: string;
  changedAt: string;
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
 * - `actionResultByDevice`: Map<deviceId, ActionResultEventPayload> — latest per-channel command
 *   result per device (success or failure), for an ACTION panel to resolve its optimistic value on.
 * - `seedHistory(deviceId, points, key)`: install fetched history (e.g. from
 *   GET /api/devices/:id/telemetry) as a device's buffer — see its own doc comment for what `key` is for.
 * - `connected`: whether the socket is currently connected.
 */
export function useDeviceSocket(deviceIds: string[]) {
  const socketRef = useRef<Socket | null>(null);
  const subscribedRef = useRef<Set<string>>(new Set());
  // Tracks which `seedHistory` key was last applied per device — see seedHistory's doc comment.
  const seedKeyByDeviceRef = useRef<Map<string, string>>(new Map());
  const [connected, setConnected] = useState(false);
  const [latestByDevice, setLatestByDevice] = useState<Map<string, ILatestTelemetry>>(new Map());
  const [historyByDevice, setHistoryByDevice] = useState<Map<string, ITelemetryPoint[]>>(new Map());
  // Latest `actionResult` per device only (not queued) — a panel matches it against its own
  // `key`/`changedAt`, see device-panel.tsx.
  const [actionResultByDevice, setActionResultByDevice] = useState<Map<string, ActionResultEventPayload>>(new Map());

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

    // Confirms an ACTION panel's command actually took effect on the device — distinct from
    // `telemetry` (periodic samples), so it's merged onto the same `latestByDevice` snapshot
    // (ACTION/VALUE panels read off it) without touching `historyByDevice`/charts, which should
    // only ever reflect real telemetry samples.
    const handleChannelState = (event: ChannelStateEventPayload) => {
      setLatestByDevice((prev) => {
        const next = new Map(prev);
        const previousPayload = prev.get(event.deviceId)?.payload;
        next.set(event.deviceId, {
          deviceId: event.deviceId,
          payload: previousPayload ? { ...previousPayload, ...event.channelStates } : event.channelStates,
          recordedAt: event.changedAt,
        });
        return next;
      });
    };

    // Point-in-time success/failure for one channel command — kept separate from
    // `latestByDevice`/`handleChannelState` above, which only ever reflects state the device
    // actually reached; an ACTION panel reads this to resolve its own optimistic value right away.
    const handleActionResult = (event: ActionResultEventPayload) => {
      setActionResultByDevice((prev) => {
        const next = new Map(prev);
        next.set(event.deviceId, event);
        return next;
      });
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('telemetry', handleTelemetry);
    socket.on('channelState', handleChannelState);
    socket.on('actionResult', handleActionResult);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('telemetry', handleTelemetry);
      socket.off('channelState', handleChannelState);
      socket.off('actionResult', handleActionResult);
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

  /**
   * Installs freshly fetched REST history for a device, replacing whatever's currently buffered —
   * but only the first time a given `key` is seen for that device. `key` should identify the query
   * that produced `points` (the dashboard passes its resolved time-range's key): a background
   * refetch of the *same* range (react-query staleTime/refetchOnWindowFocus) must not clobber
   * points appended live since that fetch, but selecting a *different* range must fully replace
   * the buffer rather than merge with it — hence keying on it instead of a one-shot "seeded at all"
   * flag. Not truncated to TELEMETRY_HISTORY_LIMIT here; the fetch's own `limit`/range already
   * bounds `points`, and live appends (handleTelemetry above) apply that cap on top as they arrive.
   */
  const seedHistory = (deviceId: string, points: ITelemetryPoint[], key: string) => {
    if (seedKeyByDeviceRef.current.get(deviceId) === key) {
      return;
    }
    seedKeyByDeviceRef.current.set(deviceId, key);
    setHistoryByDevice((prev) => {
      const next = new Map(prev);
      next.set(deviceId, points);
      return next;
    });
  };

  return { connected, latestByDevice, historyByDevice, actionResultByDevice, seedHistory };
}
