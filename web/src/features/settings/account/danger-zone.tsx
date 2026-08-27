import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useProfileQuery } from '@/features/profile/api/queries';
import { DeleteAccountDialog } from './delete-account-dialog';

export function DangerZone() {
  const { data: profile } = useProfileQuery();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-4 rounded-md border border-destructive/50 p-4">
      <div>
        <h4 className="text-sm font-medium text-destructive">Danger zone</h4>
        <p className="text-muted-foreground text-sm">Permanently delete your account and all associated data. This action cannot be undone.</p>
      </div>
      <Button type="button" variant="destructive" disabled={!profile} onClick={() => setOpen(true)}>
        Delete account
      </Button>
      {profile && <DeleteAccountDialog open={open} onOpenChange={setOpen} username={profile.username} />}
    </div>
  );
}
