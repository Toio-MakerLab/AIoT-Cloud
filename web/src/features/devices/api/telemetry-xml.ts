import type { ITelemetryExportParams } from './telemetry-export';

const escapeXml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&apos;';
    }
  });

/** Wraps an attribute value in `"…"`, escaped — a small readability helper for the template below. */
const attr = (value: string): string => `"${escapeXml(value)}"`;

/**
 * Serializes one device's telemetry history (as currently loaded by TelemetryHistoryPanel) into
 * an XML document: schema metadata first, then one `<record>` per recorded point with a
 * `<value>` per payload field that has a schema definition. Fields with no schema match (e.g. a
 * stale field a template no longer declares) are skipped rather than guessed at, same as the
 * chart panel only ever plotting known fields.
 */
export function buildTelemetryHistoryXml({ deviceId, deviceCode, deviceName, fields, telemetry, timeRange }: ITelemetryExportParams): string {
  const fieldsXml = fields
    .map((field) => `    <field key=${attr(field.key)} label=${attr(field.label)}${field.unit ? ` unit=${attr(field.unit)}` : ''} />`)
    .join('\n');

  const recordsXml = telemetry
    .map((point) => {
      const valuesXml = fields
        .filter((field) => field.key in point.payload)
        .map((field) => {
          const raw = point.payload[field.key];
          return `      <value field=${attr(field.key)}>${escapeXml(String(raw))}</value>`;
        })
        .join('\n');
      return `    <record recordedAt=${attr(new Date(point.recordedAt).toISOString())}>\n${valuesXml}\n    </record>`;
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<telemetryHistory deviceId=${attr(deviceId)} deviceCode=${attr(deviceCode ?? deviceId)}${deviceName ? ` deviceName=${attr(deviceName)}` : ''} generatedAt=${attr(new Date().toISOString())}>`,
    `  <timeRange from=${attr(timeRange.from.toISOString())} to=${attr(timeRange.to.toISOString())} />`,
    '  <fields>',
    fieldsXml,
    '  </fields>',
    `  <records count=${attr(String(telemetry.length))}>`,
    recordsXml,
    '  </records>',
    '</telemetryHistory>',
    '',
  ].join('\n');
}
