import type { ColumnDef } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import LongText from '@/components/long-text';
import type { Factory } from '../data/schema';
import { DataTableColumnHeader } from './data-table-column-header';
import { DataTableRowActions } from './data-table-row-actions';

// A hook (not a static array) so column headers can be translated — mirrors
// `useDevicesColumns` (devices/components/devices-columns.tsx).
export function useFactoriesColumns(): ColumnDef<Factory>[] {
  const { t } = useTranslation('common');
  const { t: tFactories } = useTranslation('factories');

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('words.name')} />,
      cell: ({ row }) => <LongText className="max-w-48 font-medium">{row.getValue('name')}</LongText>,
      meta: { className: 'w-48' },
      enableHiding: false,
    },
    {
      accessorKey: 'address',
      header: ({ column }) => <DataTableColumnHeader column={column} title={tFactories('columns.address')} />,
      cell: ({ row }) => <LongText className="max-w-64">{row.getValue('address') || '-'}</LongText>,
      enableSorting: false,
    },
    {
      accessorKey: 'description',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('words.description')} />,
      cell: ({ row }) => <LongText className="max-w-64">{row.getValue('description') || '-'}</LongText>,
      enableSorting: false,
    },
    {
      id: 'actions',
      cell: DataTableRowActions,
    },
  ];
}
