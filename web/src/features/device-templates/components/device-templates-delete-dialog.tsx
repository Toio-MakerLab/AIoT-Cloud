'use client';

import { IconAlertTriangle } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useDeleteDeviceTemplateMutation } from '../api/queries';
import type { DeviceTemplate } from '../data/schema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: DeviceTemplate;
}

export function DeviceTemplatesDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const [value, setValue] = useState('');
  const deleteDeviceTemplate = useDeleteDeviceTemplateMutation();

  const handleDelete = async () => {
    if (value.trim() !== currentRow.name) return;

    try {
      await deleteDeviceTemplate.mutateAsync(currentRow.id);
      onOpenChange(false);
      toast.success('Device template deleted');
    } catch (error) {
      // Deleting a template still referenced by devices fails with a
      // business-logic error (HTTP 200, non-zero `error` code) rather
      // than an AxiosError, so surface the message directly here instead
      // of relying on the global mutation error handler.
      toast.error(error instanceof Error ? error.message : 'Something went wrong!');
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== currentRow.name || deleteDeviceTemplate.isPending}
      title={
        <span className="text-destructive">
          <IconAlertTriangle className="stroke-destructive mr-1 inline-block" size={18} /> Delete Device Template
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            Are you sure you want to delete <span className="font-bold">{currentRow.name}</span>?
            <br />
            This action will permanently remove the template from the system. Templates still referenced by devices cannot be deleted. This cannot be
            undone.
          </p>

          <Label className="my-2">
            Name:
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Enter template name to confirm deletion." />
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
