import { useEffect, useState } from 'react';
import { domainConfig } from '@/lib/domain-config';
import { useAuthStore } from '@/stores/authStore';
import { type ILatestTelemetry, type ITelemetryPoint, TELEMETRY_HISTORY_LIMIT } from './telemetry-types';

export { TELEMETRY_HISTORY_LIMIT };
export type { ILatestTelemetry, ITelemetryPoint };

interface TelemetryEventData {
  deviceId: string;
  payload: Record<string, unknown>;
  recordedAt: string;
}

const RECONNECT_DELAY_MS = 3_000;

/**
 * Streams live telemetry for the dashboard over SSE (GET /devices/stream), reconnecting with a
 * fixed delay whenever the connection drops. Used for the dashboard's CHART panels — rolling
 * history plots where an occasional multi-second reconnect gap doesn't matter. ACTION/VALUE
 * panels use `useDeviceSocket` instead, for lower-latency push. Exposes the same shape as that
 * hook (`connected` / `latestByDevice` / `historyByDevice` / `seedHistory`).
 *
 * Native `EventSource` can't attach an `Authorization` header, and this backend only reads JWTs
 * off that header, so the stream is read by hand via `fetch` + a streaming body reader instead of
 * `EventSource`.
 */
export function useDeviceSse(deviceIds: string[]) {
  const [connected, setConnected] = useState(false);
  const [latestByDevice, setLatestByDevice] = useState<Map<string, ILatestTelemetry>>(new Map());
  const [historyByDevice, setHistoryByDevice] = useState<Map<string, ITelemetryPoint[]>>(new Map());

  const accessToken = useAuthStore((state) => state.auth.accessToken);
  // Dedupe + stringify so the effect only reconnects when the actual set of ids changes,
  // not on every render that passes a new array instance with the same contents.
  const idsKey = Array.from(new Set(deviceIds)).sort().join(',');

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally keyed on idsKey (a normalized version of deviceIds) rather than deviceIds itself
  useEffect(() => {
    if (!accessToken || deviceIds.length === 0) {
      setConnected(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const applyTelemetry = (event: TelemetryEventData) => {
      setLatestByDevice((prev) => {
        const next = new Map(prev);
        next.set(event.deviceId, { deviceId: event.deviceId, payload: event.payload, recordedAt: event.recordedAt });
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

    // Parses one `event:`/`data:` SSE frame (already split on the blank line that terminates it).
    const handleFrame = (frame: string) => {
      let eventType = 'message';
      const dataLines: string[] = [];
      for (const line of frame.split('\n')) {
        if (line.startsWith('event:')) {
          eventType = line.slice('event:'.length).trim();
        } else if (line.startsWith('data:')) {
          dataLines.push(line.slice('data:'.length).trim());
        }
      }
      if (dataLines.length === 0) {
        return;
      }

      try {
        const data = JSON.parse(dataLines.join('\n'));
        if (eventType === 'telemetry') {
          applyTelemetry(data as TelemetryEventData);
        }
        // 'status' and 'ping' frames are consumed (keep the connection classified as healthy)
        // but don't currently drive any dashboard state.
      } catch {
        // Malformed frame — skip it rather than tearing down the whole stream.
      }
    };

    const connect = async () => {
      const url = new URL(`${domainConfig.VITE_API_URL}/devices/stream`);
      url.searchParams.set('ids', deviceIds.join(','));

      try {
        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${accessToken}`, Accept: 'text/event-stream' },
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          throw new Error(`SSE connect failed: ${res.status}`);
        }

        setConnected(true);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (!cancelled) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }
          buffer += decoder.decode(value, { stream: true });

          // SSE frames are separated by a blank line; drain every complete frame in the buffer.
          let separatorIndex = buffer.indexOf('\n\n');
          while (separatorIndex !== -1) {
            handleFrame(buffer.slice(0, separatorIndex));
            buffer = buffer.slice(separatorIndex + 2);
            separatorIndex = buffer.indexOf('\n\n');
          }
        }
      } catch {
        // Connection failed or was interrupted — fall through to the retry below unless we were
        // the ones who aborted it (effect cleanup / deps change).
      }

      setConnected(false);
      if (!cancelled) {
        retryTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      }
    };

    connect();

    return () => {
      cancelled = true;
      controller.abort();
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
      setConnected(false);
    };
  }, [accessToken, idsKey]);

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
