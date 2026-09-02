import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { type HTMLAttributes, useMemo, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { PasswordInput } from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { authApi } from '@/features/auth/api/auth-api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

type UserAuthFormProps = HTMLAttributes<HTMLFormElement>;

function buildFormSchema(t: (key: string, options?: Record<string, unknown>) => string) {
  return z.object({
    usernameOrEmail: z.string().min(1, { message: t('signIn.usernameOrEmailRequired') }),
    password: z.string().min(1, { message: t('signIn.passwordRequired') }),
  });
}

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const { setAccessToken, setUser } = useAuthStore((state) => state.auth);
  const [isLoading, startTransition] = useTransition();
  const formSchema = useMemo(() => buildFormSchema(t), [t]);

  const { mutate: login, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: (res, variables) => {
      if (res.error !== 0) {
        if (res.message === 'error.emailNotVerified') {
          const email = variables.usernameOrEmail.includes('@') ? variables.usernameOrEmail : undefined;

          toast.error(t('signIn.emailNotVerified'), {
            action: email
              ? {
                  label: t('signIn.resendEmail'),
                  onClick: () => {
                    void authApi
                      .resendVerification({ email })
                      .then(() => toast.success(t('signIn.verificationEmailSent')))
                      .catch(() => toast.error(t('signIn.resendEmailFailed')));
                  },
                }
              : undefined,
          });
          return;
        }

        if (res.message === 'error.userDeactivated') {
          toast.error(t('signIn.accountDeactivated'));
          return;
        }

        toast.error(t('signIn.invalidCredentials'));
        return;
      }

      setAccessToken(res.data.token.accessToken);
      setUser({
        ...res.data.user,
        fullName: [res.data.user.firstName, res.data.user.lastName].filter(Boolean).join(' ') || res.data.user.username,
        picture: res.data.user.avatar,
      });
      toast.success(t('signIn.loginSuccessful'));
      navigate({ to: '/' });
    },
    onError: () => {
      toast.error(t('signIn.invalidCredentials'));
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(() => {
      login(data);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('grid gap-3', className)} {...props}>
        <FormField
          control={form.control}
          name="usernameOrEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('signIn.usernameOrEmail')}</FormLabel>
              <FormControl>
                <Input placeholder="jdoe or name@example.com" {...field} />
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
              <div className="flex items-center justify-between">
                <FormLabel>{t('signIn.password')}</FormLabel>
                <Link to="/forgot-password" className="text-muted-foreground text-sm hover:opacity-75">
                  {t('signIn.forgotPassword')}
                </Link>
              </div>
              <FormControl>
                <PasswordInput placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="mt-2" disabled={isPending && isLoading}>
          {t('signIn.login')}
        </Button>
      </form>
    </Form>
  );
}
