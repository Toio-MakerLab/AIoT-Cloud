import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfileQuery, useUpdateProfileMutation } from '@/features/profile/api/queries';

function buildFormSchema(t: (key: string) => string) {
  return z.object({
    firstName: z.string().min(1, { message: t('profile.form.firstNameRequired') }),
    lastName: z.string().min(1, { message: t('profile.form.lastNameRequired') }),
    username: z
      .string()
      .min(2, { message: t('profile.form.usernameMin') })
      .max(30, { message: t('profile.form.usernameMax') }),
    email: z.string().email(),
    phoneNumber: z.string().optional(),
  });
}

type ProfileFormValues = z.infer<ReturnType<typeof buildFormSchema>>;

const defaultValues: ProfileFormValues = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phoneNumber: '',
};

export default function ProfileForm() {
  const { t } = useTranslation('settings');
  const profileFormSchema = useMemo(() => buildFormSchema(t), [t]);
  const { data: profile, isLoading } = useProfileQuery();
  const updateProfile = useUpdateProfileMutation();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: 'onChange',
  });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      username: profile.username,
      email: profile.email ?? '',
      phoneNumber: profile.phone ?? '',
    });
  }, [profile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateProfile.mutateAsync(data);
      toast.success(t('profile.form.updated'));
    } catch {
      // Error toast is already shown by the global mutation error handler (see main.tsx).
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile.form.firstName')}</FormLabel>
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
              <FormLabel>{t('profile.form.lastName')}</FormLabel>
              <FormControl>
                <Input placeholder="Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile.form.username')}</FormLabel>
              <FormControl>
                <Input placeholder="shadcn" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile.form.email')}</FormLabel>
              <FormControl>
                <Input placeholder="m@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phoneNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('profile.form.phoneNumber')}</FormLabel>
              <FormControl>
                <Input placeholder="+1 234 567 890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={updateProfile.isPending || !form.formState.isDirty}>
          {t('profile.form.updateProfile')}
        </Button>
      </form>
    </Form>
  );
}
