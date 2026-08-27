import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RESOURCES } from '@/features/account/api/resources';
import type { Permission } from '@/features/account/api/types';
import { useIsRoot } from '@/features/account/hooks/use-is-root';
import { useRolePermissionsQuery, useUpdateRolePermissionsMutation } from '../api/queries';

const ACTIONS = [
  { key: 'canRead', label: 'Read' },
  { key: 'canCreate', label: 'Create' },
  { key: 'canUpdate', label: 'Update' },
  { key: 'canDelete', label: 'Delete' },
] as const;

function emptyPermissions(): Permission[] {
  return Object.values(RESOURCES).map((resource) => ({
    resource,
    canRead: false,
    canCreate: false,
    canUpdate: false,
    canDelete: false,
  }));
}

interface Props {
  role: string;
}

export function RolePermissionMatrix({ role }: Props) {
  const canUpdate = useIsRoot();
  const { data, isPending } = useRolePermissionsQuery(role);
  const updatePermissions = useUpdateRolePermissionsMutation(role);
  const [permissions, setPermissions] = useState<Permission[]>(emptyPermissions());

  useEffect(() => {
    if (!data) return;
    const byResource = new Map(data.data.permissions.map((p) => [p.resource, p]));
    setPermissions(
      Object.values(RESOURCES).map(
        (resource) =>
          byResource.get(resource) ?? {
            resource,
            canRead: false,
            canCreate: false,
            canUpdate: false,
            canDelete: false,
          },
      ),
    );
  }, [data]);

  const toggle = (resource: string, key: (typeof ACTIONS)[number]['key']) => {
    setPermissions((prev) => prev.map((p) => (p.resource === resource ? { ...p, [key]: !p[key] } : p)));
  };

  const handleSave = async () => {
    try {
      await updatePermissions.mutateAsync({ permissions });
      toast.success(`Permissions updated for ${role}`);
    } catch {
      // Error toast is already shown by the global mutation error handler (see main.tsx).
    }
  };

  if (isPending) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource</TableHead>
              {ACTIONS.map((action) => (
                <TableHead key={action.key} className="text-center">
                  {action.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {permissions.map((permission) => (
              <TableRow key={permission.resource}>
                <TableCell className="font-medium">{permission.resource}</TableCell>
                {ACTIONS.map((action) => (
                  <TableCell key={action.key} className="text-center">
                    <Switch checked={permission[action.key]} disabled={!canUpdate} onCheckedChange={() => toggle(permission.resource, action.key)} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {canUpdate && (
        <Button onClick={handleSave} disabled={updatePermissions.isPending}>
          Save changes
        </Button>
      )}
    </div>
  );
}
