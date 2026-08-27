export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

/** A device is swept to OFFLINE once its lastSeenAt is older than this. */
export const DEVICE_OFFLINE_THRESHOLD_MS = 60 * 1000;
