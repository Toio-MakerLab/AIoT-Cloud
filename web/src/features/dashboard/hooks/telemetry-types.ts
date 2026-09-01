// Shared shapes for live device data delivered over the dashboard's WebSocket connection — see
// `use-device-socket.ts`.

// Bounds the live-appended rolling buffer (see use-device-socket.ts's `handleTelemetry`), which
// otherwise grows forever for the life of the page. Sized above the largest range-filter fetch
// (500, the backend's max — see DeviceTelemetryQueryDto) so a live push right after loading a wide
// time range doesn't immediately truncate it back down.
export const TELEMETRY_HISTORY_LIMIT = 1000;

export interface ITelemetryPoint {
  payload: Record<string, unknown>;
  recordedAt: string;
}

export interface ILatestTelemetry {
  deviceId: string;
  payload: Record<string, unknown>;
  recordedAt: string;
}
