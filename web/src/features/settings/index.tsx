import { IconNotification, IconPalette, IconTool, IconUser } from '@tabler/icons-react';
import { Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { LanguageSwitch } from '@/components/language-switch';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { NotificationsNav } from '@/components/notifications-nav';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { Separator } from '@/components/ui/separator';
import SidebarNav from './components/sidebar-nav';

export default function Settings() {
  const { t } = useTranslation('settings');

  // Display's sidebar entry is commented out below (see git history) — this stays a plain array
  // built inside the component (rather than a module-level const) purely so the titles can come
  // from `t()`.
  const sidebarNavItems = [
    {
      title: t('nav.profile'),
      icon: <IconUser size={18} />,
      href: '/settings',
    },
    {
      title: t('nav.account'),
      icon: <IconTool size={18} />,
      href: '/settings/account',
    },
    {
      title: t('nav.appearance'),
      icon: <IconPalette size={18} />,
      href: '/settings/appearance',
    },
    {
      title: t('nav.notifications'),
      icon: <IconNotification size={18} />,
      href: '/settings/notifications',
    },
    // {
    //   title: 'Display',
    //   icon: <IconBrowserCheck size={18} />,
    //   href: '/settings/display',
    // },
  ];

  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <LanguageSwitch />
          <NotificationsNav />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Separator className="my-4 lg:my-6" />
        <div className="flex flex-1 flex-col space-y-2 overflow-hidden md:space-y-2 lg:flex-row lg:space-y-0 lg:space-x-12">
          <aside className="top-0 lg:sticky lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex w-full overflow-y-hidden p-1">
            <Outlet />
          </div>
        </div>
      </Main>
    </>
  );
}
