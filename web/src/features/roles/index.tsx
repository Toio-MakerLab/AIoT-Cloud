import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { NotificationsNav } from '@/components/notifications-nav';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsRoot } from '@/features/account/hooks/use-is-root';
import ForbiddenError from '@/features/errors/forbidden';
import { useRolesQuery } from './api/queries';
import { RolePermissionMatrix } from './components/role-permission-matrix';

export default function Roles() {
  const isRoot = useIsRoot();
  const { data, isPending } = useRolesQuery();
  const [role, setRole] = useState<string | null>(null);

  if (!isRoot) {
    return <ForbiddenError />;
  }

  const roles = data?.data ?? [];
  const activeRole = role ?? roles[0]?.name ?? null;

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <NotificationsNav />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="space-y-6 px-2 py-2">
          <Card>
            <CardHeader>
              <CardTitle>Roles & Permissions</CardTitle>
              <CardDescription>Control which resources each role can read, create, update, or delete.</CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Permission Matrix</CardTitle>
              <CardDescription>Select a role, then toggle access per resource.</CardDescription>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Tabs value={activeRole ?? undefined} onValueChange={setRole}>
                  <TabsList>
                    {roles.map((r) => (
                      <TabsTrigger key={r.name} value={r.name}>
                        {r.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}

              {activeRole && (
                <div className="mt-4">
                  <RolePermissionMatrix role={activeRole} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  );
}
