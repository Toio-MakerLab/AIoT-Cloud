import { useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard component that protects routes and syncs Logto auth state
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const { user, isAuthenticated: hasLocalAuth } = useAuthStore((state) => state.auth);
  const [isLoading] = useState(false);
  const [isAuthenticated] = useState(false);

  // Track if we've already synced to prevent infinite loops
  const hasSyncedRef = useRef(false);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">{t('actions.loading')}</p>
        </div>
      </div>
    );
  }

  // Show loading while syncing user data
  if (isAuthenticated && !user && hasSyncedRef.current) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">{t('authGuard.settingUpAccount')}</p>
        </div>
      </div>
    );
  }

  // Show login redirect if not authenticated
  if (!isAuthenticated && !hasLocalAuth()) {
    navigate({ to: '/sign-in' });
  }

  return <>{children}</>;
}
