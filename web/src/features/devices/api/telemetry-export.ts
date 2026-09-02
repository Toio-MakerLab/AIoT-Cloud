import type { IDeviceTelemetry, ITelemetryFieldDefinition } from './types';

/** Shared input for every telemetry-history export format (XML, Excel, …) — see telemetry-xml.ts / telemetry-excel.ts. */
export interface ITelemetryExportParams {
  deviceId: string;
  /** Human-readable device identifier (device.deviceId), if known — falls back to `deviceId`. */
  deviceCode?: string;
  deviceName?: string;
  fields: ITelemetryFieldDefinition[];
  telemetry: IDeviceTelemetry[];
  timeRange: { from: Date; to: Date };
}
