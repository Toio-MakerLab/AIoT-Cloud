import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import type { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFactories } from '../context/factories-context';
import type { Factory } from '../data/schema';
import { useIsFactoryAdmin } from '../hooks/use-is-factory-admin';

interface DataTableRowActionsProps {
  row: Row<Factory>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useFactories();
  // Mutating routes (POST/PUT/DELETE) are ADMIN/ROOT only on the backend
  // (see factory.controller.ts @Auth decorators). Gate directly on role.
  const isAdmin = useIsFactoryAdmin();

  if (!isAdmin) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="data-[state=open]:bg-muted flex h-8 w-8 p-0">
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original);
            setOpen('edit');
          }}
        >
          Edit
          <DropdownMenuShortcut>
            <IconEdit size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(row.original);
            setOpen('delete');
          }}
          className="text-destructive"
        >
          Delete
          <DropdownMenuShortcut>
            <IconTrash size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
