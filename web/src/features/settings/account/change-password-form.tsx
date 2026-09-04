import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { PasswordInput } from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { authApi } from '@/features/auth/api/auth-api';

function buildFormSchema(t: (key: string) => string) {
  return z
    .object({
      currentPassword: z.string().min(1, { message: t('account.changePassword.currentPasswordRequired') }),
      newPassword: z.string().min(6, { message: t('account.changePassword.newPasswordMin') }),
      confirmPassword: z.string().min(1, { message: t('account.changePassword.confirmPasswordRequired') }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: t('account.changePassword.passwordsDoNotMatch'),
      path: ['confirmPassword'],
    });
}

type ChangePasswordFormValues = z.infer<ReturnType<typeof buildFormSchema>>;

const defaultValues: ChangePasswordFormValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export function ChangePasswordForm() {
  const { t } = useTranslation('settings');
  const changePasswordFormSchema = useMemo(() => buildFormSchema(t), [t]);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues,
  });

  const { mutate: changePassword, isPending } = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: (res) => {
      if (res.error !== 0) {
        if (res.message === 'error.currentPasswordIncorrect') {
          form.setError('currentPassword', { message: t('account.changePassword.currentPasswordIncorrect') });
          return;
        }

        toast.error(t('account.changePassword.changeFailed'));
        return;
      }

      toast.success(t('account.changePassword.changed'));
      form.reset(defaultValues);
    },
    onError: () => {
      toast.error(t('account.changePassword.changeFailed'));
    },
  });

  function onSubmit(data: ChangePasswordFormValues) {
    changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
  }

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div>
        <h4 className="text-sm font-medium">{t('account.changePassword.title')}</h4>
        <p className="text-muted-foreground text-sm">{t('account.changePassword.description')}</p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('account.changePassword.currentPassword')}</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('account.changePassword.newPassword')}</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('account.changePassword.confirmPassword')}</FormLabel>
                <FormControl>
                  <PasswordInput placeholder="********" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending}>
            {t('account.changePassword.update')}
          </Button>
        </form>
      </Form>
    </div>
  );
}
