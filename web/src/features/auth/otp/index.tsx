import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AuthLayout from '../auth-layout';
import { OtpForm } from './components/otp-form';

export default function Otp() {
  const { t } = useTranslation('auth');
  return (
    <AuthLayout>
      <Card className="gap-4">
        <CardHeader>
          <CardTitle className="text-base tracking-tight">{t('otp.title')}</CardTitle>
          <CardDescription>
            {t('otp.line1')} <br /> {t('otp.line2')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OtpForm />
        </CardContent>
        <CardFooter>
          <p className="text-muted-foreground px-8 text-center text-sm">
            {t('otp.notReceived')}{' '}
            <Link to="/sign-in" className="hover:text-primary underline underline-offset-4">
              {t('otp.resend')}
            </Link>
            .
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  );
}
