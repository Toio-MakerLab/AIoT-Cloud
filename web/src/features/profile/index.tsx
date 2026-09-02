import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { LanguageSwitch } from '@/components/language-switch';
import { Header } from '@/components/layout/header';
import { Main } from '@/components/layout/main';
import { NotificationsNav } from '@/components/notifications-nav';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Search } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/features/auth/api/auth-api';
import { useProfileQuery } from './api/queries';

export default function Profile() {
  const { t } = useTranslation('profile');
  const { data: profile, isPending } = useProfileQuery();

  const { mutate: resend, isPending: isResending } = useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: (res) => {
      if (res.error === 0) {
        toast.success(t('verificationEmailSent'));
      } else {
        toast.error(t('resendFailed'));
      }
    },
    onError: () => toast.error(t('resendFailed')),
  });

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ms-auto flex items-center space-x-4">
          <ThemeSwitch />
          <LanguageSwitch />
          <NotificationsNav />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">{t('myAccount')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>{t('profile')}</CardTitle>
            <CardDescription>{t('description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPending || !profile ? (
              <p className="text-muted-foreground text-sm">{t('loading')}</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{t('username')}</p>
                    <p className="font-medium">{profile.username}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('role')}</p>
                    <p className="font-medium">{profile.role}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('firstName')}</p>
                    <p className="font-medium">{profile.firstName ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{t('lastName')}</p>
                    <p className="font-medium">{profile.lastName ?? '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">{t('email')}</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{profile.email ?? '-'}</p>
                      {profile.isEmailVerified ? (
                        <Badge variant="secondary">{t('verified')}</Badge>
                      ) : (
                        <Badge variant="destructive">{t('notVerified')}</Badge>
                      )}
                    </div>
                  </div>
                  {profile.phone && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">{t('phone')}</p>
                      <p className="font-medium">{profile.phone}</p>
                    </div>
                  )}
                </div>

                {!profile.isEmailVerified && profile.email && (
                  <Button variant="outline" disabled={isResending} onClick={() => resend({ email: profile.email! })}>
                    {t('resendVerificationEmail')}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </Main>
    </>
  );
}
