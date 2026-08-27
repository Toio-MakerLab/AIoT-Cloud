// Shared shapes for live device data, regardless of which transport (SSE or WebSocket) fetched
// it — see `use-device-sse.ts` and `use-device-socket.ts`.

export const TELEMETRY_HISTORY_LIMIT = 100;

export interface ITelemetryPoint {
  payload: Record<string, unknown>;
  recordedAt: string;
}

export interface ILatestTelemetry {
  deviceId: string;
  payload: Record<string, unknown>;
  recordedAt: string;
}
