import type { ColumnDef } from '@tanstack/react-table';
import LongText from '@/components/long-text';
import { Badge } from '@/components/ui/badge';
import { activeBadgeClasses, getDeviceTemplateTypeMeta } from '../data/data';
import type { DeviceTemplate } from '../data/schema';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';

export const columns: ColumnDef<DeviceTemplate>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <LongText className="max-w-48">{row.getValue('name')}</LongText>,
    meta: { className: 'w-48' },
    enableHiding: false,
  },
  {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.getValue<DeviceTemplate['type']>('type');
      const typeMeta = getDeviceTemplateTypeMeta(type);

      return (
        <div className="flex items-center gap-x-2">
          {typeMeta?.icon && <typeMeta.icon className="text-muted-foreground size-4" />}
          <span className="text-sm">{typeMeta?.label ?? type}</span>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: 'manufacturer',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Manufacturer" />,
    cell: ({ row }) => <div className="w-fit text-nowrap">{row.getValue('manufacturer') || '-'}</div>,
    enableSorting: false,
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const isActive = row.getValue<boolean>('isActive');
      const badgeColor = activeBadgeClasses.get(isActive);

      return (
        <div className="flex space-x-2">
          <Badge variant="outline" className={badgeColor}>
            {isActive ? 'Active' : 'Inactive'}
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
