'use client';

import { IconAlertTriangle } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeleteDeviceMutation } from '../api/queries';
import type { Device } from '../data/schema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: Device;
}

export function DevicesDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const { t } = useTranslation('devices');
  const { t: tCommon } = useTranslation('common');
  const [value, setValue] = useState('');
  const deleteDevice = useDeleteDeviceMutation();

  const handleDelete = async () => {
    if (value.trim() !== currentRow.name) return;

    try {
      await deleteDevice.mutateAsync(currentRow.id);
      onOpenChange(false);
      toast.success(t('deleteDialog.deleted'));
    } catch {
      // Error toast is already shown by the global mutation error handler (see main.tsx).
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.name || deleteDevice.isPending}
      title={
        <span className="text-destructive">
          <IconAlertTriangle className="stroke-destructive mr-1 inline-block" size={18} /> {t('deleteDialog.title')}
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            {t('deleteDialog.confirmPrefix')} <span className="font-bold">{currentRow.name}</span>?
            <br />
            {t('deleteDialog.warning', { deviceId: currentRow.deviceId })}
          </p>

          <Label className="my-2">
            {t('deleteDialog.deviceName')}
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={t('deleteDialog.confirmPlaceholder')} />
          </Label>
        </div>
      }
      confirmText={tCommon('actions.delete')}
      destructive
    />
  );
}
