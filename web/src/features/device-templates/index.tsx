import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from '@/components/language-switch';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { NotificationsNav } from '@/components/notifications-nav';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { useDeviceTemplatesQuery } from './api/queries';
import { mapIDeviceTemplateToDeviceTemplate } from './api/utils';
import { useDeviceTemplatesColumns } from './components/device-templates-columns';
import { DeviceTemplatesDialogs } from './components/device-templates-dialogs';
import { DeviceTemplatesPrimaryButtons } from './components/device-templates-primary-buttons';
import { DeviceTemplatesTable } from './components/device-templates-table';
import DeviceTemplatesProvider from './context/device-templates-context';

// Backend caps `take` at 50 (see PageOptionsDto), so this fetches a single
// large page and paginates/filters client-side, same as the `users` feature
// (which fetches its full list in one call). Catalogs of device templates
// are expected to be small; if this grows past 50 rows, switch to real
// server-driven pagination wired to page/take/q instead.
export default function DeviceTemplates() {
  const { t } = useTranslation('deviceTemplates');
  const { data } = useDeviceTemplatesQuery({ take: 50, order: 'ASC' });
  const templateList = data?.data?.map(mapIDeviceTemplateToDeviceTemplate) ?? [];
  const columns = useDeviceTemplatesColumns();

  return (
    <DeviceTemplatesProvider>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <LanguageSwitch />
          <NotificationsNav />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-2 flex flex-wrap items-center justify-between space-y-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{t('list.title')}</h2>
            <p className="text-muted-foreground">{t('list.subtitle')}</p>
          </div>
          <DeviceTemplatesPrimaryButtons />
        </div>
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          <DeviceTemplatesTable data={templateList} columns={columns} />
        </div>
      </Main>

      <DeviceTemplatesDialogs />
    </DeviceTemplatesProvider>
  );
}
