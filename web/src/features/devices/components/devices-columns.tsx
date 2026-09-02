import { IconDotsVertical, IconEye, IconSettings, IconTrash } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { formatDistanceToNow, type Locale } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Language } from '@/context/language-context';
import { useIsGuest } from '@/hooks/use-is-guest';
import { cn } from '@/lib/utils';
import { useDevices } from '../context/devices-context';
import { deviceStatusColors, getDeviceTemplateTypeLabel } from '../data/data';
import type { Device } from '../data/schema';
import { DataTableColumnHeader } from './data-table-column-header';

const DATE_FNS_LOCALES: Record<Language, Locale> = { [Language.EN]: enUS, [Language.VI]: vi };

function DeviceRowActions({ row }: { row: { original: Device } }) {
  const { t } = useTranslation('devices');
  const { t: tCommon } = useTranslation('common');
  const { setOpen, setCurrentRow } = useDevices();
  const isGuest = useIsGuest();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="data-[state=open]:bg-muted h-8 w-8 p-0">
          <IconDotsVertical className="h-4 w-4" />
          <span className="sr-only">{tCommon('actions.openMenu')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[170px]">
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original);
            setOpen('view-config');
          }}
        >
          {t('columns.viewConfig')}
          <IconEye className="ml-auto h-4 w-4" />
        </DropdownMenuItem>
        {/* Edit/Delete are write actions — hidden for the read-only GUEST role. */}
        {!isGuest && (
          <>
            <DropdownMenuItem
              onClick={() => {
                setCurrentRow(row.original);
                setOpen('config');
              }}
            >
              {t('columns.editConfig')}
              <IconSettings className="ml-auto h-4 w-4" />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                setCurrentRow(row.original);
                setOpen('delete');
              }}
            >
              {tCommon('actions.delete')}
              <IconTrash className="ml-auto h-4 w-4" />
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// A hook (not a static array) so column headers/cells can be translated — mirrors
// `useSidebarData` (components/layout/data/sidebar-data.tsx).
export function useDevicesColumns(): ColumnDef<Device>[] {
  const { t, i18n } = useTranslation('devices');

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.name')} />,
      cell: ({ row }) => (
        <Link to="/devices/$deviceId" params={{ deviceId: row.original.id }} className="w-fit text-nowrap font-medium hover:underline">
          {row.getValue('name')}
        </Link>
      ),
      enableHiding: false,
    },
    {
      accessorKey: 'deviceId',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.deviceId')} />,
      cell: ({ row }) => <div className="text-muted-foreground font-mono text-xs">{row.getValue('deviceId')}</div>,
    },
    {
      id: 'template',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.template')} />,
      cell: ({ row }) => {
        const { template } = row.original;

        if (!template) {
          return <span className="text-muted-foreground">—</span>;
        }

        return (
          <div className="flex flex-col">
            <span>{template.name}</span>
            <span className="text-muted-foreground text-xs">{getDeviceTemplateTypeLabel(template.type)}</span>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.status')} />,
      cell: ({ row }) => {
        const { status } = row.original;
        const badgeColor = deviceStatusColors.get(status);

        return (
          <Badge variant="outline" className={cn('capitalize', badgeColor)}>
            {status === 'ONLINE' ? t('columns.online') : t('columns.offline')}
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: 'lastSeenAt',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.lastSeen')} />,
      cell: ({ row }) => {
        const { lastSeenAt } = row.original;

        if (!lastSeenAt) {
          return <span className="text-muted-foreground">{t('columns.never')}</span>;
        }

        return <span>{formatDistanceToNow(lastSeenAt, { addSuffix: true, locale: DATE_FNS_LOCALES[i18n.language as Language] })}</span>;
      },
    },
    {
      id: 'actions',
      cell: DeviceRowActions,
    },
  ];
}
