export const DeviceActionType = {
  TOGGLE: 'TOGGLE',
  BUTTON: 'BUTTON',
} as const;
export type DeviceActionType = (typeof DeviceActionType)[keyof typeof DeviceActionType];
