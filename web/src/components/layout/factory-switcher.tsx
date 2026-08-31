import { IconBuildingFactory2 } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { ChevronsUpDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { RoleType } from '@/constants/role-type';
import { useMyFactoryQuery } from '@/features/factories/api/queries';
import { useAuthStore } from '@/stores/authStore';

// Accounts belong to at most one factory (`UserEntity.factoryId`), so unlike the old hardcoded
// multi-"team" switcher this replaced, there's nothing to switch between — it's a read-only
// display of the caller's own factory, plus a shortcut into `/factories` management for admins.
export function FactorySwitcher() {
  const { isMobile } = useSidebar();
  const role = useAuthStore((state) => state.auth.user?.role);
  const isGuest = role === RoleType.GUEST;
  const isAdmin = role === RoleType.ADMIN || role === RoleType.ROOT;
  // GUEST accounts have unrestricted system-wide read access instead of a factory.
  const { data: factory, isPending } = useMyFactoryQuery(!isGuest);

  const name = isGuest ? 'All Factories' : isPending ? 'Loading…' : (factory?.name ?? 'No factory assigned');
  const subtitle = isGuest ? 'Guest (read-only)' : (factory?.address ?? 'Unassigned');

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <IconBuildingFactory2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{name}</span>
                <span className="truncate text-xs">{subtitle}</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">Factory</DropdownMenuLabel>
            <DropdownMenuItem disabled className="gap-2 p-2">
              <div className="flex size-6 items-center justify-center rounded-sm border">
                <IconBuildingFactory2 className="size-3.5" />
              </div>
              {name}
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem asChild className="gap-2 p-2">
                <Link to="/factories">
                  <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                    <IconBuildingFactory2 className="size-4" />
                  </div>
                  <span className="text-muted-foreground font-medium">Manage factories</span>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
