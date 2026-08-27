import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useProfileQuery, useUpdateProfileMutation } from '@/features/profile/api/queries';

const profileFormSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required.' }),
  lastName: z.string().min(1, { message: 'Last name is required.' }),
  username: z
    .string()
    .min(2, { message: 'Username must be at least 2 characters.' })
    .max(30, { message: 'Username must not be longer than 30 characters.' }),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

const defaultValues: ProfileFormValues = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  phoneNumber: '',
};

export default function ProfileForm() {
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
      toast.success('Profile updated');
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
              <FormLabel>First name</FormLabel>
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
              <FormLabel>Last name</FormLabel>
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
              <FormLabel>Username</FormLabel>
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
              <FormLabel>Email</FormLabel>
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
              <FormLabel>Phone number</FormLabel>
              <FormControl>
                <Input placeholder="+1 234 567 890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={updateProfile.isPending || !form.formState.isDirty}>
          Update profile
        </Button>
      </form>
    </Form>
  );
}
