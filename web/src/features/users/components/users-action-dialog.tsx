'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { PasswordInput } from '@/components/password-input';
import { SelectDropdown } from '@/components/select-dropdown';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RoleType } from '@/constants/role-type';
import { useFactoriesQuery } from '@/features/factories/api/queries';
import { useCreateUserMutation, useUpdateUserMutation } from '../api/queries';
import { getUserRoles } from '../data/data';
import type { User } from '../data/schema';
import { userRoleSchema } from '../data/schema';

// No Radix SelectItem may have an empty string value, so "no factory" is
// represented by this sentinel and mapped to `null` on submit.
const NO_FACTORY_VALUE = 'none';

function buildFormSchema(t: (key: string, options?: Record<string, unknown>) => string) {
  const baseSchema = {
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    role: userRoleSchema.optional(),
    factoryId: z.string().optional(),
  };

  return z.object({
    username: z.string().min(3, { message: t('actionDialog.usernameMin') }),
    password: z
      .string()
      .min(6, { message: t('actionDialog.passwordMin') })
      .optional()
      .or(z.literal('')),
    isActive: z.boolean().optional(),
    ...baseSchema,
  });
}

type UserForm = z.infer<ReturnType<typeof buildFormSchema>>;

interface Props {
  currentRow?: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UsersActionDialog({ currentRow, open, onOpenChange }: Props) {
  const { t } = useTranslation('users');
  const { t: tCommon } = useTranslation('common');
  const isEdit = !!currentRow;
  const userFormSchema = useMemo(() => buildFormSchema(t), [t]);
  const userRoles = useMemo(() => getUserRoles(t), [t]);
  const createUser = useCreateUserMutation();
  const updateUser = useUpdateUserMutation();
  const isSubmitting = createUser.isPending || updateUser.isPending;
  const { data: factoriesPage, isPending: isFactoriesPending } = useFactoriesQuery({ take: 50, order: 'ASC' });
  const factoryItems = [
    { label: t('actionDialog.noFactory'), value: NO_FACTORY_VALUE },
    ...(factoriesPage?.data.map((factory) => ({ label: factory.name, value: factory.id })) ?? []),
  ];

  const form = useForm<UserForm>({
    resolver: zodResolver(userFormSchema),
    defaultValues: isEdit
      ? {
          username: currentRow.username,
          password: '',
          firstName: currentRow.firstName ?? '',
          lastName: currentRow.lastName ?? '',
          email: currentRow.email ?? '',
          phone: currentRow.phone ?? '',
          role: currentRow.role ?? RoleType.USER,
          isActive: currentRow.isActive ?? true,
          factoryId: currentRow.factoryId ?? NO_FACTORY_VALUE,
        }
      : {
          username: '',
          password: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          role: RoleType.USER,
          factoryId: NO_FACTORY_VALUE,
        },
  });

  const onSubmit = async (values: UserForm) => {
    if (!isEdit && !values.password) {
      form.setError('password', {
        message: t('actionDialog.passwordMin'),
      });
      return;
    }

    try {
      const payload = {
        ...values,
        email: values.email || undefined,
        password: values.password || undefined,
        factoryId: values.factoryId === NO_FACTORY_VALUE ? null : values.factoryId,
      };

      if (isEdit && currentRow) {
        await updateUser.mutateAsync({ id: currentRow.id, data: payload });
        toast.success(t('actionDialog.updated'));
      } else {
        await createUser.mutateAsync({
          ...payload,
          password: payload.password!,
        });
        toast.success(t('actionDialog.created'));
      }
      form.reset();
      onOpenChange(false);
    } catch (error) {
      // The backend returns business failures (e.g. duplicate username) as
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
        <DialogHeader>
          <DialogTitle>{isEdit ? t('actionDialog.editTitle') : t('actionDialog.addTitle')}</DialogTitle>
          <DialogDescription>
            {isEdit ? t('actionDialog.editDescription') : t('actionDialog.addDescription')} {t('actionDialog.clickSaveHint')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form id="user-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('actionDialog.username')} <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="jdoe" {...field} disabled={isEdit} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('actionDialog.password')}
                    {isEdit ? ` ${t('actionDialog.passwordKeepUnchanged')}` : ''} {!isEdit && <span className="text-red-500">*</span>}
                  </FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('actionDialog.firstName')}</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('actionDialog.lastName')}</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('actionDialog.email')}</FormLabel>
                  <FormControl>
                    <Input placeholder="jdoe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('actionDialog.phone')}</FormLabel>
                  <FormControl>
                    <Input placeholder="+1 555 555 5555" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('columns.role')}</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder={t('actionDialog.selectRole')}
                    items={userRoles}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="factoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('actionDialog.factory')}</FormLabel>
                  <SelectDropdown
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                    placeholder={t('actionDialog.selectFactory')}
                    items={factoryItems}
                    isPending={isFactoriesPending}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {isEdit && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between">
                    <FormLabel>{tCommon('words.active')}</FormLabel>
                    <FormControl>
                      <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </form>
        </Form>
        <DialogFooter>
          <Button type="submit" form="user-form" disabled={isSubmitting}>
            {tCommon('actions.saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
