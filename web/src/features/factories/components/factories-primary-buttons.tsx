import { IconPlus } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { useFactories } from '../context/factories-context';
import { useIsFactoryAdmin } from '../hooks/use-is-factory-admin';

export function FactoriesPrimaryButtons() {
  const { setOpen } = useFactories();
  const isAdmin = useIsFactoryAdmin();

  if (!isAdmin) return null;

  return (
    <div className="flex gap-2">
      <Button className="space-x-1" onClick={() => setOpen('add')}>
        <span>Add Factory</span> <IconPlus size={18} />
      </Button>
    </div>
  );
}
