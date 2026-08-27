import {
  IconBook,
  IconBriefcase,
  IconBrowserCheck,
  IconBuildingWarehouse,
  IconCalendar,
  IconCalendarWeek,
  IconChecklist,
  IconEdit,
  IconFileText,
  IconFolder,
  IconHelp,
  IconLayout,
  IconLayoutDashboard,
  IconMessages,
  IconNotebook,
  IconNotification,
  IconPackages,
  IconPalette,
  IconPencil,
  IconPoint,
  IconSettings,
  IconSquareCheck,
  IconTag,
  IconTool,
  IconUserCog,
  IconUsers,
  IconWriting,
} from '@tabler/icons-react';

export type MenuIcon = React.ComponentType<{ className?: string }>;

export const ICON_OPTIONS: { value: string; label: string; icon: MenuIcon }[] = [
  { value: 'layout', label: 'Layout', icon: IconLayout },
  {
    value: 'layout-dashboard',
    label: 'Layout Dashboard',
    icon: IconLayoutDashboard,
  },
  { value: 'file-text', label: 'File Text', icon: IconFileText },
  { value: 'folder', label: 'Folder', icon: IconFolder },
  { value: 'tag', label: 'Tag', icon: IconTag },
  { value: 'message-square', label: 'Message', icon: IconMessages },
  { value: 'book', label: 'Book', icon: IconBook },
  { value: 'calendar-week', label: 'Calendar Week', icon: IconCalendarWeek },
  { value: 'checklist', label: 'Checklist', icon: IconChecklist },
  { value: 'check-square', label: 'Check Square', icon: IconSquareCheck },
  { value: 'notebook', label: 'Notebook', icon: IconNotebook },
  { value: 'pencil', label: 'Pencil', icon: IconPencil },
  { value: 'edit', label: 'Edit', icon: IconEdit },
  { value: 'pen-tool', label: 'Pen Tool', icon: IconWriting },
  { value: 'calendar', label: 'Calendar', icon: IconCalendar },
  { value: 'briefcase', label: 'Briefcase', icon: IconBriefcase },
  {
    value: 'building-warehouse',
    label: 'Building Warehouse',
    icon: IconBuildingWarehouse,
  },
  { value: 'packages', label: 'Packages', icon: IconPackages },
  { value: 'users', label: 'Users', icon: IconUsers },
  { value: 'settings', label: 'Settings', icon: IconSettings },
  { value: 'user-cog', label: 'User Cog', icon: IconUserCog },
  { value: 'tool', label: 'Tool', icon: IconTool },
  { value: 'palette', label: 'Palette', icon: IconPalette },
  { value: 'notification', label: 'Notification', icon: IconNotification },
  { value: 'browser-check', label: 'Browser Check', icon: IconBrowserCheck },
  { value: 'help', label: 'Help', icon: IconHelp },
];

const ICON_MAP: Record<string, MenuIcon> = Object.fromEntries(ICON_OPTIONS.map((option) => [option.value, option.icon]));

export function resolveIcon(name?: string): MenuIcon | undefined {
  if (!name) return undefined;
  return ICON_MAP[name] ?? IconPoint;
}
