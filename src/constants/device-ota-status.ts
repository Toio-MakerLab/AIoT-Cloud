/**
 * Lifecycle of a single OTA (over-the-air) firmware update attempt on a device — driven by
 * `DeviceOtaService.triggerUpdate` (cloud -> device) and `handleOtaStatusReport` (device -> cloud
 * progress updates). Plain varchar column on `DeviceEntity`/`DeviceOtaUpdateEntity` rather than a
 * Postgres enum type, same reasoning as `DeviceLifecycleStage` — validated in code, so adding a
 * status later never needs an `ALTER TYPE` migration.
 */
export enum DeviceOtaStatus {
  /** No update ever attempted, or the device has never reported back. */
  IDLE = 'IDLE',
  /** Update command just dispatched; no progress report from the device yet. */
  PENDING = 'PENDING',
  /** Device is fetching the firmware binary. */
  DOWNLOADING = 'DOWNLOADING',
  /** Device downloaded the binary and is flashing/applying it. */
  INSTALLING = 'INSTALLING',
  /** Device confirmed it's now running the target firmware version. */
  SUCCESS = 'SUCCESS',
  /** Device (or the publish attempt itself) reported the update failed — see the `error` field. */
  FAILED = 'FAILED',
}

/** Statuses that mean "an update is currently in flight" — used to reject a second trigger until this one resolves. */
export const OTA_IN_PROGRESS_STATUSES: DeviceOtaStatus[] = [DeviceOtaStatus.PENDING, DeviceOtaStatus.DOWNLOADING, DeviceOtaStatus.INSTALLING];
