import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { NotificationsNav } from '@/components/notifications-nav';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { useDevicesQuery } from './api/queries';
import { mapIDeviceToDevice } from './api/utils';
import { columns } from './components/devices-columns';
import { DevicesDialogs } from './components/devices-dialogs';
import { DevicesPrimaryButtons } from './components/devices-primary-buttons';
import { DevicesTable } from './components/devices-table';
import { UnclaimedDevicesPanel } from './components/unclaimed-devices-panel';
import DevicesProvider from './context/devices-context';

export default function Devices() {
  const { data } = useDevicesQuery({ take: 50 });
  const deviceList = data?.data?.map(mapIDeviceToDevice) ?? [];

  return (
    <DevicesProvider>
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
            <h2 className="text-2xl font-bold tracking-tight">My Devices</h2>
            <p className="text-muted-foreground">Manage the IoT devices linked to your account.</p>
          </div>
          <DevicesPrimaryButtons />
        </div>
        <UnclaimedDevicesPanel />
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          <DevicesTable columns={columns} data={deviceList} />
        </div>
      </Main>

      <DevicesDialogs />
    </DevicesProvider>
  );
}
