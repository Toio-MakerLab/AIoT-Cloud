import * as XLSX from 'xlsx';
import type { ITelemetryExportParams } from './telemetry-export';

/**
 * Serializes one device's telemetry history into an in-memory .xlsx workbook (one "Telemetry
 * History" sheet, one row per recorded point) — same record set as buildTelemetryHistoryXml,
 * just tabular. Returns the raw bytes; hand them to `downloadFile` with an "xlsx" mime type.
 */
export function buildTelemetryHistoryExcel({ deviceCode, deviceId, fields, telemetry, timeRange }: ITelemetryExportParams): ArrayBuffer {
  const header = ['Recorded At', ...fields.map((field) => field.label + (field.unit ? ` (${field.unit})` : ''))];
  const rows = telemetry.map((point) => [
    new Date(point.recordedAt).toLocaleString(),
    ...fields.map((field) => (field.key in point.payload ? (point.payload[field.key] as string | number) : '')),
  ]);

  const sheet = XLSX.utils.aoa_to_sheet([
    [`Device: ${deviceCode ?? deviceId}`],
    [`Range: ${timeRange.from.toLocaleString()} — ${timeRange.to.toLocaleString()}`],
    [],
    header,
    ...rows,
  ]);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Telemetry History');
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}
