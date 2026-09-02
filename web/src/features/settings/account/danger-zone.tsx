import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useProfileQuery } from '@/features/profile/api/queries';
import { DeleteAccountDialog } from './delete-account-dialog';

export function DangerZone() {
  const { t } = useTranslation('settings');
  const { data: profile } = useProfileQuery();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4 rounded-md border border-destructive/50 p-4">
      <div>
        <h4 className="text-sm font-medium text-destructive">{t('account.dangerZone.title')}</h4>
        <p className="text-muted-foreground text-sm">{t('account.dangerZone.description')}</p>
      </div>
      <Button type="button" variant="destructive" disabled={!profile} onClick={() => setOpen(true)}>
        {t('account.dangerZone.deleteAccount')}
      </Button>
      {profile && <DeleteAccountDialog open={open} onOpenChange={setOpen} username={profile.username} />}
    </div>
  );
}
