import { IconUserPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { useUsers } from '../context/users-context';
import { useIsUserAdmin } from '../hooks/use-is-user-admin';

export function UsersPrimaryButtons() {
  const { setOpen } = useUsers();
  const isAdmin = useIsUserAdmin();

  if (!isAdmin) return null;

  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen('add')}>
        <span>Add User</span> <IconUserPlus size={18} />
      </Button>
    </div>
  );
}
