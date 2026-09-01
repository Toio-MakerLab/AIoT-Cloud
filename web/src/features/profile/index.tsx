import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
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
  const { data: profile, isPending } = useProfileQuery();

  const { mutate: resend, isPending: isResending } = useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: (res) => {
      if (res.error === 0) {
        toast.success('Verification email sent');
      } else {
        toast.error('Failed to resend verification email');
      }
    },
    onError: () => toast.error('Failed to resend verification email'),
  });

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
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight">My Account</h1>
          <p className="text-muted-foreground">Your current account information.</p>
        </div>

        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Information tied to your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isPending || !profile ? (
              <p className="text-muted-foreground text-sm">Loading...</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Username</p>
                    <p className="font-medium">{profile.username}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Role</p>
                    <p className="font-medium">{profile.role}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">First name</p>
                    <p className="font-medium">{profile.firstName ?? '-'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last name</p>
                    <p className="font-medium">{profile.lastName ?? '-'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Email</p>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{profile.email ?? '-'}</p>
                      {profile.isEmailVerified ? <Badge variant="secondary">Verified</Badge> : <Badge variant="destructive">Not verified</Badge>}
                    </div>
                  </div>
                  {profile.phone && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium">{profile.phone}</p>
                    </div>
                  )}
                </div>

                {!profile.isEmailVerified && profile.email && (
                  <Button variant="outline" disabled={isResending} onClick={() => resend({ email: profile.email! })}>
                    Resend verification email
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
