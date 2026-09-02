'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateFactoryMutation, useUpdateFactoryMutation } from '../api/queries';
import type { Factory } from '../data/schema';

function buildFormSchema(t: (key: string, options?: Record<string, unknown>) => string) {
  return z.object({
    name: z.string().min(1, { message: t('actionDialog.nameRequired') }),
    address: z.string().optional(),
    description: z.string().optional(),
  });
}
type FactoryForm = z.infer<ReturnType<typeof buildFormSchema>>;

interface Props {
  currentRow?: Factory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FactoriesActionDialog({ currentRow, open, onOpenChange }: Props) {
  const { t } = useTranslation('factories');
  const { t: tCommon } = useTranslation('common');
  const isEdit = !!currentRow;
  const formSchema = useMemo(() => buildFormSchema(t), [t]);
  const createFactory = useCreateFactoryMutation();
  const updateFactory = useUpdateFactoryMutation();
  const isSubmitting = createFactory.isPending || updateFactory.isPending;

  const form = useForm<FactoryForm>({
    resolver: zodResolver(formSchema),
    defaultValues: isEdit
      ? {
          name: currentRow.name,
          address: currentRow.address ?? '',
          description: currentRow.description ?? '',
        }
      : {
          name: '',
          address: '',
          description: '',
        },
  });

  const onSubmit = async (values: FactoryForm) => {
    try {
      if (isEdit && currentRow) {
        await updateFactory.mutateAsync({ id: currentRow.id, data: values });
        toast.success(t('actionDialog.updated'));
      } else {
        await createFactory.mutateAsync(values);
        toast.success(t('actionDialog.created'));
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // The backend returns business failures (e.g. duplicate name) as
      // HTTP 200 with a non-zero `error` code, so they surface here as a
      // thrown Error rather than an AxiosError the global mutation error
      // handler can parse — toast the message explicitly.
      toast.error(error instanceof Error ? error.message : tCommon('errors.somethingWentWrong'));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        onOpenChange(state);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-left">
          <DialogTitle>{isEdit ? t('actionDialog.editTitle') : t('actionDialog.addTitle')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('actionDialog.editDescription') : t('actionDialog.addDescription')} {t('actionDialog.clickSaveHint')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="factory-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-0.5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-right">{tCommon('words.name')}</FormLabel>
                  <FormControl className="col-span-4">
                    <Input placeholder="KCN Song Than" {...field} />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-right">{t('actionDialog.address')}</FormLabel>
                  <FormControl className="col-span-4">
                    <Input placeholder="Dĩ An, Bình Dương" {...field} />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-right">{tCommon('words.description')}</FormLabel>
                  <FormControl className="col-span-4">
                    <Textarea placeholder={t('actionDialog.descriptionPlaceholder')} className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="submit" form="factory-form" disabled={isSubmitting}>
            {tCommon('actions.saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
