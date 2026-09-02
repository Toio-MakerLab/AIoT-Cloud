import { IconAlertTriangle } from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeleteProfileMutation } from '@/features/profile/api/queries';
import { useAuthStore } from '@/stores/authStore';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
}

export function DeleteAccountDialog({ open, onOpenChange, username }: Props) {
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const [value, setValue] = useState('');
  const navigate = useNavigate();
  const reset = useAuthStore((state) => state.auth.reset);
  const deleteProfile = useDeleteProfileMutation();

  const handleDelete = async () => {
    if (value.trim() !== username) return;

    try {
      await deleteProfile.mutateAsync();
      onOpenChange(false);
      reset();
      toast.success(t('account.dangerZone.accountDeleted'));
      navigate({ to: '/sign-in' });
    } catch {
      // Error toast is already shown by the global mutation error handler (see main.tsx).
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setValue('');
        onOpenChange(next);
      }}
      handleConfirm={handleDelete}
      disabled={value.trim() !== username || deleteProfile.isPending}
      isLoading={deleteProfile.isPending}
      title={
        <span className="text-destructive">
          <IconAlertTriangle className="stroke-destructive mr-1 inline-block" size={18} /> {t('account.dangerZone.deleteAccountTitle')}
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            {t('account.dangerZone.confirmPrefix')} <span className="font-bold">{username}</span>?
            <br />
            {t('account.dangerZone.warning')}
          </p>

          <Label className="my-2">
            {t('account.dangerZone.username')}
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={t('account.dangerZone.confirmPlaceholder')} />
          </Label>

          <Alert variant="destructive">
            <AlertTitle>{t('account.dangerZone.warningTitle')}</AlertTitle>
            <AlertDescription>{t('account.dangerZone.warningDescription')}</AlertDescription>
          </Alert>
        </div>
      }
      confirmText={tCommon('actions.delete')}
      destructive
    />
  );
}
