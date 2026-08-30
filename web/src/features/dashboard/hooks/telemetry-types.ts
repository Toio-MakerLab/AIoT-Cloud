// Shared shapes for live device data delivered over the dashboard's WebSocket connection — see
// `use-device-socket.ts`.

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
