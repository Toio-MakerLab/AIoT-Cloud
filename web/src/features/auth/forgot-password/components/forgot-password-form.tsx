import { zodResolver } from '@hookform/resolvers/zod';
import { type HTMLAttributes, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ForgotFormProps = HTMLAttributes<HTMLFormElement>;

function buildFormSchema(t: (key: string, options?: Record<string, unknown>) => string) {
  return z.object({
    email: z
      .string()
      .min(1, { message: t('forgotPassword.emailRequired') })
      .email({ message: t('forgotPassword.emailInvalid') }),
  });
}

export function ForgotPasswordForm({ className, ...props }: ForgotFormProps) {
  const { t } = useTranslation('auth');
  const [isLoading, setIsLoading] = useState(false);
  const formSchema = useMemo(() => buildFormSchema(t), [t]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    // eslint-disable-next-line no-console
    console.log(data);

    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('grid gap-2', className)} {...props}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>{t('forgotPassword.email')}</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="mt-2" disabled={isLoading}>
          {t('forgotPassword.continue')}
        </Button>
      </form>
    </Form>
  );
}
