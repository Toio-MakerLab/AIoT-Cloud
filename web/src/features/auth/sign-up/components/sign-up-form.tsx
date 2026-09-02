import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
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

type SignUpFormProps = HTMLAttributes<HTMLFormElement>;

function buildFormSchema(t: (key: string, options?: Record<string, unknown>) => string) {
  return z
    .object({
      username: z
        .string()
        .min(3, { message: t('signUp.usernameMin') })
        .max(32, { message: t('signUp.usernameMax') }),
      firstName: z.string().min(1, { message: t('signUp.firstNameRequired') }),
      lastName: z.string().min(1, { message: t('signUp.lastNameRequired') }),
      email: z
        .string()
        .min(1, { message: t('signUp.emailRequired') })
        .email({ message: t('signUp.emailInvalid') }),
      password: z
        .string()
        .min(1, {
          message: t('signUp.passwordRequired'),
        })
        .min(6, {
          message: t('signUp.passwordMin'),
        }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('signUp.passwordsDontMatch'),
      path: ['confirmPassword'],
    });
}

export function SignUpForm({ className, ...props }: SignUpFormProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const [isLoading, startTransition] = useTransition();
  const formSchema = useMemo(() => buildFormSchema(t), [t]);

  const { mutate: register, isPending } = useMutation({
    mutationFn: authApi.register,
    onSuccess: (res, variables) => {
      if (res.error !== 0) {
        if (res.message === 'error.userAlreadyExists') {
          toast.error(t('signUp.usernameOrEmailInUse'));
          return;
        }
        toast.error(t('signUp.createAccountFailed'));
        return;
      }

      toast.success(t('signUp.accountCreated'));
      navigate({
        to: '/verify-email',
        search: { email: variables.email },
      });
    },
    onError: () => {
      toast.error(t('signUp.createAccountFailed'));
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    startTransition(() => {
      register(data);
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('grid gap-3', className)} {...props}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('signUp.username')}</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('signUp.firstName')}</FormLabel>
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
                <FormLabel>{t('signUp.lastName')}</FormLabel>
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
              <FormLabel>{t('signUp.email')}</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
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
              <FormLabel>{t('signUp.password')}</FormLabel>
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
              <FormLabel>{t('signUp.confirmPassword')}</FormLabel>
              <FormControl>
                <PasswordInput placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="mt-2" disabled={isPending && isLoading}>
          {t('signUp.createAccount')}
        </Button>
      </form>
    </Form>
  );
}
