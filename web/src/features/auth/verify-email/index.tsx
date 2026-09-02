import { useMutation } from '@tanstack/react-query';
import { Link, useSearch } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authApi } from '@/features/auth/api/auth-api';
import AuthLayout from '../auth-layout';

export default function VerifyEmail() {
  const { t } = useTranslation('auth');
  const search = useSearch({ from: '/(auth)/verify-email' });
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const attempted = useRef(false);

  const { mutate: verify, isPending } = useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: (res) => setStatus(res.error === 0 ? 'success' : 'error'),
    onError: () => setStatus('error'),
  });

  const { mutate: resend, isPending: isResending } = useMutation({
    mutationFn: authApi.resendVerification,
    onSuccess: (res) => {
      if (res.error === 0) {
        toast.success(t('verifyEmail.emailSent'));
      } else {
        toast.error(t('verifyEmail.resendFailed'));
      }
    },
    onError: () => toast.error(t('verifyEmail.resendFailed')),
  });

  useEffect(() => {
    if (search.email && search.token && !attempted.current) {
      attempted.current = true;
      verify({ email: search.email, token: search.token });
    }
  }, [search.email, search.token, verify]);

  return (
    <AuthLayout>
      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-lg tracking-tight">{t('verifyEmail.title')}</CardTitle>
          <CardDescription>
            {search.token
              ? isPending
                ? t('verifyEmail.verifying')
                : status === 'success'
                  ? t('verifyEmail.success')
                  : status === 'error'
                    ? t('verifyEmail.error')
                    : null
              : t('verifyEmail.linkSent', { email: search.email ?? t('verifyEmail.yourEmail') })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {status === 'success' ? (
            <Button asChild>
              <Link to="/sign-in">{t('verifyEmail.goToSignIn')}</Link>
            </Button>
          ) : (
            search.email && (
              <Button variant="outline" disabled={isResending} onClick={() => resend({ email: search.email! })}>
                {t('verifyEmail.resendEmail')}
              </Button>
            )
          )}
        </CardContent>
      </Card>
    </AuthLayout>
  );
}
