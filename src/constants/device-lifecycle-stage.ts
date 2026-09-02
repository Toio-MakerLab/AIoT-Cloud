/** Where a device sits in its operating life, derived from its lifecycle health score (see DeviceLifecycleService). */
export enum DeviceLifecycleStage {
  /** Just registered/installed — too little uptime/telemetry history yet for the score to mean anything. */
  NEW = 'NEW',
  /** Healthy: high score, well within its expected lifespan. */
  ACTIVE = 'ACTIVE',
  /** Score has started slipping (age, connectivity, or telemetry warnings) — worth keeping an eye on. */
  AGING = 'AGING',
  /** Score low enough that upkeep (cleaning, part swap, recalibration) is recommended before it degrades further. */
  MAINTENANCE_DUE = 'MAINTENANCE_DUE',
  /** Score very low and/or past its expected lifespan — replacement should be planned. */
  END_OF_LIFE = 'END_OF_LIFE',
  /** Manually retired by a user/admin; assessment stops recomputing this device's stage once set. */
  DECOMMISSIONED = 'DECOMMISSIONED',
}
