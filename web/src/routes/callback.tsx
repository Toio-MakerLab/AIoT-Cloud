import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

function CallbackPage() {
  const { t } = useTranslation('auth');
  const isLoading = false;
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">{t('callback.signingIn')}</p>
        </div>
      </div>
    );
  }

  return null;
}

export const Route = createFileRoute('/callback')({
  component: CallbackPage,
});
