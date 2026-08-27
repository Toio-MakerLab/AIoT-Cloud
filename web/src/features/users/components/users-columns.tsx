import type { ColumnDef } from '@tanstack/react-table';
import LongText from '@/components/long-text';
import { Badge } from '@/components/ui/badge';
import { getUserRoleLabel, roleBadgeClasses } from '../data/data';
import type { User } from '../data/schema';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'username',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Username" />,
    cell: ({ row }) => <LongText className="max-w-36">{row.getValue('username')}</LongText>,
    meta: { className: 'w-48' },
    enableHiding: false,
  },
  {
    id: 'fullName',
    accessorFn: (row) => [row.firstName, row.lastName].filter(Boolean).join(' '),
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <div className="w-fit text-nowrap">{[row.original.firstName, row.original.lastName].filter(Boolean).join(' ') || '-'}</div>,
    enableSorting: false,
  },
  {
    accessorKey: 'email',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    cell: ({ row }) => <div className="w-fit text-nowrap">{row.getValue('email') || '-'}</div>,
    enableSorting: false,
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const isActive = row.getValue<boolean | null | undefined>('isActive');

      return <Badge variant={isActive === false ? 'destructive' : 'success'}>{isActive === false ? 'Inactive' : 'Active'}</Badge>;
    },
    enableSorting: false,
  },
  {
    accessorKey: 'role',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Role" />,
    cell: ({ row }) => {
      const role = row.getValue<User['role']>('role');
      const badgeClass = role ? roleBadgeClasses.get(role) : undefined;

      return (
        <div className="flex space-x-2">
          <Badge variant="outline" className={badgeClass}>
            {getUserRoleLabel(role)}
          </Badge>
        </div>
      );
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
];
