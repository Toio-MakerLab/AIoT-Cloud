'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCreateDeviceSecretMutation } from '../api/queries';

const formSchema = z.object({
  label: z.string().optional(),
});
type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDeviceSecretDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation('deviceSecrets');
  const [plaintext, setPlaintext] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const createDeviceSecret = useCreateDeviceSecretMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { label: '' },
  });

  const handleOpenChange = (state: boolean) => {
    if (!state) {
      form.reset({ label: '' });
      setPlaintext(null);
      setCopied(false);
    }
    onOpenChange(state);
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      const result = await createDeviceSecret.mutateAsync({
        label: values.label || undefined,
      });
      setPlaintext(result.plaintext);
    } catch {
      // Error toast is already shown by the global mutation error handler (see main.tsx).
    }
  };

  const handleCopy = async () => {
    if (!plaintext) return;
    await navigator.clipboard.writeText(plaintext);
    setCopied(true);
    toast.success(t('createDialog.copied'));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        {plaintext ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('createDialog.createdTitle')}</DialogTitle>
              <DialogDescription>{t('createDialog.createdDescription')}</DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-2">
              <Input readOnly value={plaintext} className="font-mono text-xs" />
              <Button type="button" size="icon" variant="outline" onClick={() => void handleCopy()}>
                {copied ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>{t('createDialog.done')}</Button>
            </DialogFooter>
          </>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <DialogHeader>
                <DialogTitle>{t('createDialog.title')}</DialogTitle>
                <DialogDescription>{t('createDialog.description')}</DialogDescription>
              </DialogHeader>
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem className="py-2">
                    <FormLabel>{t('createDialog.label')}</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Production 2026-08" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createDeviceSecret.isPending}>
                  {t('createDialog.create')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
