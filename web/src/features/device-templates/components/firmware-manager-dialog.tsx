'use client';

import { IconLoader2, IconTrash, IconUpload } from '@tabler/icons-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useDeleteFirmwareMutation, useFirmwaresQuery, useUpdateFirmwareMutation, useUploadFirmwareMutation } from '../api/queries';
import type { IFirmware } from '../api/types';
import type { DeviceTemplate } from '../data/schema';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRow: DeviceTemplate;
}

function formatBytes(bytes?: number | null) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Firmware catalog for one device template — lets an admin upload/register `.bin` builds that
 * `DeviceOtaPanel` (features/devices) can later push to a device of this template via OTA.
 */
export function FirmwareManagerDialog({ open, onOpenChange, currentRow }: Props) {
  const { t } = useTranslation('deviceTemplates');
  const { t: tCommon } = useTranslation('common');
  const { data: firmwares, isLoading } = useFirmwaresQuery(currentRow.id);
  const uploadFirmware = useUploadFirmwareMutation();
  const updateFirmware = useUpdateFirmwareMutation(currentRow.id);
  const deleteFirmware = useDeleteFirmwareMutation(currentRow.id);

  const [version, setVersion] = useState('');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pendingDelete, setPendingDelete] = useState<IFirmware | null>(null);

  const handleUpload = async () => {
    if (!version.trim() || !file) return;

    try {
      await uploadFirmware.mutateAsync({ templateId: currentRow.id, version: version.trim(), file, releaseNotes: releaseNotes.trim() || undefined });
      toast.success(t('firmware.uploaded'));
      setVersion('');
      setReleaseNotes('');
      setFile(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon('errors.somethingWentWrong'));
    }
  };

  const handleToggleActive = async (firmware: IFirmware, isActive: boolean) => {
    try {
      await updateFirmware.mutateAsync({ id: firmware.id, data: { isActive } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon('errors.somethingWentWrong'));
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteFirmware.mutateAsync(pendingDelete.id);
      toast.success(t('firmware.deleted'));
      setPendingDelete(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : tCommon('errors.somethingWentWrong'));
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader className="text-left">
            <DialogTitle>{t('firmware.title', { name: currentRow.name })}</DialogTitle>
            <DialogDescription>{t('firmware.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
              <Label className="space-y-1.5">
                <span className="text-muted-foreground text-xs">{t('firmware.version')}</span>
                <Input placeholder="1.4.2" value={version} onChange={(event) => setVersion(event.target.value)} />
              </Label>
              <Label className="space-y-1.5">
                <span className="text-muted-foreground text-xs">{t('firmware.binFile')}</span>
                <Input type="file" accept=".bin" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
              </Label>
              <Label className="col-span-full space-y-1.5">
                <span className="text-muted-foreground text-xs">{t('firmware.releaseNotes')}</span>
                <Textarea
                  className="resize-none"
                  rows={2}
                  value={releaseNotes}
                  onChange={(event) => setReleaseNotes(event.target.value)}
                  placeholder={t('firmware.releaseNotesPlaceholder')}
                />
              </Label>
              <div className="col-span-full flex justify-end">
                <Button size="sm" disabled={!version.trim() || !file || uploadFirmware.isPending} onClick={() => void handleUpload()}>
                  {uploadFirmware.isPending ? <IconLoader2 className="h-4 w-4 animate-spin" /> : <IconUpload className="h-4 w-4" />}
                  {t('firmware.upload')}
                </Button>
              </div>
            </div>

            <ScrollArea className="h-72 rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('firmware.version')}</TableHead>
                    <TableHead>{tCommon('words.size')}</TableHead>
                    <TableHead>{tCommon('words.active')}</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground text-center text-sm">
                        {t('firmware.loading')}
                      </TableCell>
                    </TableRow>
                  ) : !firmwares?.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-muted-foreground text-center text-sm">
                        {t('firmware.empty')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    firmwares.map((firmware) => (
                      <TableRow key={firmware.id}>
                        <TableCell>
                          <div className="font-medium">{firmware.version}</div>
                          {firmware.releaseNotes && <div className="text-muted-foreground text-xs">{firmware.releaseNotes}</div>}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{formatBytes(firmware.sizeBytes)}</TableCell>
                        <TableCell>
                          <Switch checked={firmware.isActive} onCheckedChange={(checked) => void handleToggleActive(firmware, checked)} />
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => setPendingDelete(firmware)}>
                            <IconTrash className="text-destructive h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {!!firmwares?.length && (
              <div className="flex flex-wrap gap-1">
                {firmwares
                  .filter((firmware) => !firmware.isActive)
                  .map((firmware) => (
                    <Badge key={firmware.id} variant="outline" className="text-muted-foreground">
                      {t('firmware.inactiveBadge', { version: firmware.version })}
                    </Badge>
                  ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        handleConfirm={() => void handleDelete()}
        disabled={deleteFirmware.isPending}
        title={t('firmware.deleteTitle')}
        desc={t('firmware.deleteDesc', { version: pendingDelete?.version })}
        confirmText={tCommon('actions.delete')}
        destructive
      />
    </>
  );
}
