import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { NotificationsNav } from '@/components/notifications-nav';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { useUsersQuery } from './api/queries';
import { mapIUserToUser } from './api/utils';
import { columns } from './components/users-columns';
import { UsersDialogs } from './components/users-dialogs';
import { UsersPrimaryButtons } from './components/users-primary-buttons';
import { UsersTable } from './components/users-table';
import UsersProvider from './context/users-context';

// Backend caps `take` at 50 (see PageOptionsDto), so this fetches a single
// large page and paginates/filters client-side, same as the
// `device-templates` feature. User accounts are expected to stay in the
// tens-to-low-hundreds range; if this grows past 50, switch to real
// server-driven pagination wired to page/take/q instead.
export default function Users() {
  const { data } = useUsersQuery({ take: 50, order: 'ASC' });
  const userList = data?.data?.map(mapIUserToUser) ?? [];

  return (
    <UsersProvider>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <NotificationsNav />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">Manage user accounts and their roles here.</p>
          </div>
          <UsersPrimaryButtons />
        </div>
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          <UsersTable data={userList} columns={columns} />
        </div>
      </Main>

      <UsersDialogs />
    </UsersProvider>
  );
}
