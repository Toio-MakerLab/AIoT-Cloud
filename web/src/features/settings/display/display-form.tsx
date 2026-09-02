import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { showSubmittedData } from '@/utils/show-submitted-data';

function buildFormSchema(t: (key: string) => string) {
  return z.object({
    items: z.array(z.string()).refine((value) => value.some((item) => item), {
      message: t('display.form.selectAtLeastOne'),
    }),
  });
}

type DisplayFormValues = z.infer<ReturnType<typeof buildFormSchema>>;

// This can come from your database or API.
const defaultValues: Partial<DisplayFormValues> = {
  items: ['recents', 'home'],
};

export function DisplayForm() {
  const { t } = useTranslation('settings');
  const displayFormSchema = useMemo(() => buildFormSchema(t), [t]);
  const items = [
    { id: 'recents', label: t('display.form.items.recents') },
    { id: 'home', label: t('display.form.items.home') },
    { id: 'applications', label: t('display.form.items.applications') },
    { id: 'desktop', label: t('display.form.items.desktop') },
    { id: 'downloads', label: t('display.form.items.downloads') },
    { id: 'documents', label: t('display.form.items.documents') },
  ] as const;

  const form = useForm<DisplayFormValues>({
    resolver: zodResolver(displayFormSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => showSubmittedData(data))} className="space-y-8">
        <FormField
          control={form.control}
          name="items"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">{t('display.form.sidebar')}</FormLabel>
                <FormDescription>{t('display.form.sidebarDescription')}</FormDescription>
              </div>
              {items.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="items"
                  render={({ field }) => {
                    return (
                      <FormItem key={item.id} className="flex flex-row items-start space-y-0 space-x-3">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(field.value?.filter((value) => value !== item.id));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">{item.label}</FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{t('display.form.update')}</Button>
      </form>
    </Form>
  );
}
