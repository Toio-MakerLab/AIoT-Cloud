import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Fills in the telemetry schema for existing SENSOR_NODE-type templates. Unlike
 * SeedGatewayTemplate/SeedRelay2ChAcs712Template, the air-quality sensor node template was created
 * ad-hoc (via the API, not a seed migration), so `telemetry_schema` never got populated — without
 * it, the dashboard CHART widgets and the device detail page's Telemetry History panel have no
 * fields to offer, even though the real hardware is already reporting all of these in its payload
 * (`{ o3, co2, no2, so2, voc, apms, pm10, pm25, light, sound, humidity, pressure, vibration,
 * temperature }`).
 *
 * This is a plain UPDATE (not the guarded "insert if name doesn't exist yet" pattern the other
 * seed migrations use) because the template row already exists in every environment that has this
 * problem — there's no fresh-install case to guard against here.
 */
export class UpdateSensorNodeTelemetrySchema1789100000000 implements MigrationInterface {
  name = 'UpdateSensorNodeTelemetrySchema1789100000000';

  private readonly telemetrySchema = [
    { key: 'temperature', label: 'Temperature', unit: '°C' },
    { key: 'humidity', label: 'Humidity', unit: '%' },
    { key: 'pressure', label: 'Pressure', unit: 'hPa' },
    { key: 'co2', label: 'CO2', unit: 'ppm', warningMin: 0, warningMax: 1000 },
    { key: 'voc', label: 'VOC', unit: 'ppb' },
    { key: 'o3', label: 'Ozone (O3)', unit: 'ppm' },
    { key: 'no2', label: 'Nitrogen Dioxide (NO2)', unit: 'ppm' },
    { key: 'so2', label: 'Sulfur Dioxide (SO2)', unit: 'ppm' },
    { key: 'pm10', label: 'PM10', unit: 'µg/m³', warningMin: 0, warningMax: 150 },
    { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', warningMin: 0, warningMax: 55 },
    { key: 'apms', label: 'Air Particulate Score', unit: 'index' },
    { key: 'light', label: 'Light', unit: 'lux' },
    { key: 'sound', label: 'Sound Level', unit: 'dB' },
    { key: 'vibration', label: 'Vibration', unit: 'g' },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "device_templates" SET "telemetry_schema" = $1 WHERE "type" = 'SENSOR_NODE'`, [
      JSON.stringify(this.telemetrySchema),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Best-effort only — the prior per-row schema wasn't captured before overwriting it, so there's
    // nothing to restore beyond clearing it back out.
    await queryRunner.query(`UPDATE "device_templates" SET "telemetry_schema" = NULL WHERE "type" = 'SENSOR_NODE'`);
  }
}
