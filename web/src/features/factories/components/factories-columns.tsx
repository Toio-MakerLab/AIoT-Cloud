import type { ColumnDef } from '@tanstack/react-table';
import LongText from '@/components/long-text';
import type { Factory } from '../data/schema';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';

export const columns: ColumnDef<Factory>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <LongText className="max-w-48 font-medium">{row.getValue('name')}</LongText>,
    meta: { className: 'w-48' },
    enableHiding: false,
  },
  {
    accessorKey: 'address',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Address" />,
    cell: ({ row }) => <LongText className="max-w-64">{row.getValue('address') || '-'}</LongText>,
    enableSorting: false,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => <LongText className="max-w-64">{row.getValue('description') || '-'}</LongText>,
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
];
