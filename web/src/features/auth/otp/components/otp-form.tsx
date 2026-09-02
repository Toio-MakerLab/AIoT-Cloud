import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { type HTMLAttributes, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';
import { showSubmittedData } from '@/utils/show-submitted-data';

type OtpFormProps = HTMLAttributes<HTMLFormElement>;

function buildFormSchema(t: (key: string, options?: Record<string, unknown>) => string) {
  return z.object({
    otp: z.string().min(1, { message: t('otp.otpRequired') }),
  });
}

export function OtpForm({ className, ...props }: OtpFormProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const [isLoading, setIsLoading] = useState(false);
  const formSchema = useMemo(() => buildFormSchema(t), [t]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { otp: '' },
  });

  const otp = form.watch('otp');

  function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true);
    showSubmittedData(data);

    setTimeout(() => {
      setIsLoading(false);
      navigate({ to: '/' });
    }, 1000);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn('grid gap-2', className)} {...props}>
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">{t('otp.oneTimePassword')}</FormLabel>
              <FormControl>
                <InputOTP maxLength={6} {...field} containerClassName='justify-between sm:[&>[data-slot="input-otp-group"]>div]:w-12'>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className="mt-2" disabled={otp.length < 6 || isLoading}>
          {t('otp.verify')}
        </Button>
      </form>
    </Form>
  );
}
