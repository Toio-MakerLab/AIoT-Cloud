import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from '@/components/language-switch';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { NotificationsNav } from '@/components/notifications-nav';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { useFactoriesQuery } from './api/queries';
import { mapIFactoryToFactory } from './api/utils';
import { useFactoriesColumns } from './components/factories-columns';
import { FactoriesDialogs } from './components/factories-dialogs';
import { FactoriesPrimaryButtons } from './components/factories-primary-buttons';
import { FactoriesTable } from './components/factories-table';
import FactoriesProvider from './context/factories-context';

// Backend caps `take` at 50 (see PageOptionsDto), so this fetches a single
// large page and paginates/filters client-side, same as the `device-templates`
// feature. Factory catalogs are expected to be small; if this grows past 50
// rows, switch to real server-driven pagination wired to page/take/q instead.
export default function Factories() {
  const { t } = useTranslation('factories');
  const { data } = useFactoriesQuery({ take: 50, order: 'ASC' });
  const factoryList = data?.data?.map(mapIFactoryToFactory) ?? [];
  const columns = useFactoriesColumns();

  return (
    <FactoriesProvider>
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
          <FactoriesPrimaryButtons />
        </div>
        <div className="-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12">
          <FactoriesTable data={factoryList} columns={columns} />
        </div>
      </Main>

      <FactoriesDialogs />
    </FactoriesProvider>
  );
}
