export interface Permission {
  resource: string;
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface IAccountMenuNavItem {
  title: string;
  icon?: string;
  url?: string;
  permission?: Permission;
  items?: IAccountMenuNavItem[];
}

export interface IAccountMenuNavGroup {
  title: string;
  items: IAccountMenuNavItem[];
}

export interface IAccountMenuData {
  role: string;
  navGroups: IAccountMenuNavGroup[] | null;
}
