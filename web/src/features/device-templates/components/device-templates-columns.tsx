import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import LongText from '@/components/long-text';
import { Badge } from '@/components/ui/badge';
import { activeBadgeClasses, getDeviceTemplateTypeLabel, getDeviceTemplateTypeMeta } from '../data/data';
import type { DeviceTemplate } from '../data/schema';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';

// A hook (not a static array) so column headers/cells can be translated — mirrors
// `useDevicesColumns` (devices/components/devices-columns.tsx).
export function useDeviceTemplatesColumns(): ColumnDef<DeviceTemplate>[] {
  const { t } = useTranslation('deviceTemplates');
  const { t: tCommon } = useTranslation('common');

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={tCommon('words.name')} />,
      cell: ({ row }) => <LongText className="max-w-48">{row.getValue('name')}</LongText>,
      meta: { className: 'w-48' },
      enableHiding: false,
    },
    {
      accessorKey: 'type',
      header: ({ column }) => <DataTableColumnHeader column={column} title={tCommon('words.type')} />,
      cell: ({ row }) => {
        const type = row.getValue<DeviceTemplate['type']>('type');
        const typeMeta = getDeviceTemplateTypeMeta(type);

        return (
          <div className="flex items-center gap-x-2">
            {typeMeta?.icon && <typeMeta.icon className="text-muted-foreground size-4" />}
            <span className="text-sm">{getDeviceTemplateTypeLabel(type, t)}</span>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'manufacturer',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.manufacturer')} />,
      cell: ({ row }) => <div className="w-fit text-nowrap">{row.getValue('manufacturer') || '-'}</div>,
      enableSorting: false,
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => <DataTableColumnHeader column={column} title={tCommon('words.status')} />,
      cell: ({ row }) => {
        const isActive = row.getValue<boolean>('isActive');
        const badgeColor = activeBadgeClasses.get(isActive);

        return (
          <div className="flex space-x-2">
            <Badge variant="outline" className={badgeColor}>
              {isActive ? tCommon('words.active') : tCommon('words.inactive')}
            </Badge>
          </div>
        );
      },
      filterFn: (row, id, value) => {
        const status = row.getValue<boolean>(id) ? 'active' : 'inactive';
        return value.includes(status);
      },
      enableSorting: false,
    },
    {
      id: 'actions',
      cell: DataTableRowActions,
    },
  ];
}
