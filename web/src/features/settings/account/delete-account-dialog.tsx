import { IconAlertTriangle } from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
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
      toast.success('Account deleted');
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
          <IconAlertTriangle className="stroke-destructive mr-1 inline-block" size={18} /> Delete Account
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            Are you sure you want to delete your account <span className="font-bold">{username}</span>?
            <br />
            This will permanently remove your account and all associated data. This cannot be undone.
          </p>

          <Label className="my-2">
            Username:
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter your username to confirm deletion." />
          </Label>

          <Alert variant="destructive">
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>Please be careful, this operation cannot be rolled back.</AlertDescription>
          </Alert>
        </div>
      }
      confirmText="Delete"
      destructive
    />
  );
}
