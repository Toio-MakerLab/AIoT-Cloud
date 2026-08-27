// Self-contained types for the dashboard feature. Duplicated (rather than imported from
// features/devices or features/device-templates) to keep this feature folder independent,
// matching the pattern used by features/users.

export type DeviceStatus = 'ONLINE' | 'OFFLINE';

export type WidgetType = 'VALUE' | 'CHART' | 'ACTION';

export interface IDeviceActionField {
  key: string;
  label: string;
  type: 'TOGGLE' | 'BUTTON';
  onValue?: string | null;
  offValue?: string | null;
}

export interface IDeviceTemplate {
  id: string;
  name: string;
  type: string;
  description?: string | null;
  manufacturer?: string | null;
  icon?: string | null;
  telemetrySchema?: Array<{
    key: string;
    label?: string;
    unit?: string;
    [k: string]: unknown;
  }> | null;
  actionSchema?: IDeviceActionField[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IDevice {
  id: string;
  deviceId: string;
  name: string;
  templateId: string;
  template?: IDeviceTemplate;
  userId: string;
  lastSeenAt?: string | null;
  status: DeviceStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IPageMeta {
  page: number;
  take: number;
  itemCount: number;
  pageCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface IPageDto<T> {
  data: T[];
  meta: IPageMeta;
}

export interface IDeviceTelemetry {
  id: string;
  deviceId: string;
  payload: Record<string, unknown>;
  recordedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface IDashboardWidget {
  id: string;
  deviceId: string;
  widgetType: WidgetType;
  field?: string;
  title?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface IDashboard {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  widgets: IDashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

export interface ISaveDashboard {
  name: string;
  isDefault?: boolean;
  widgets?: IDashboardWidget[];
}

export interface ITriggerDeviceAction {
  key: string;
  value: string;
}
