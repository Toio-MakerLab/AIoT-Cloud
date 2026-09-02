import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, CaretSortIcon, CheckIcon } from '@radix-ui/react-icons';
import { format } from 'date-fns';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Language, useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';
import { showSubmittedData } from '@/utils/show-submitted-data';

function buildFormSchema(t: (key: string, options?: Record<string, unknown>) => string) {
  return z.object({
    name: z
      .string()
      .min(2, {
        message: t('account.form.nameMin'),
      })
      .max(30, {
        message: t('account.form.nameMax'),
      }),
    dob: z.date({
      required_error: t('account.form.dobRequired'),
    }),
    language: z.nativeEnum(Language, {
      required_error: t('account.form.languageRequired'),
    }),
  });
}

type AccountFormValues = z.infer<ReturnType<typeof buildFormSchema>>;

export function AccountForm() {
  const { t } = useTranslation('settings');
  const { language, setLanguage } = useLanguage();
  const accountFormSchema = useMemo(() => buildFormSchema(t), [t]);
  // `language` mirrors the header's LanguageSwitch (see components/language-switch.tsx) — picking
  // one here calls the same `setLanguage`, it's not a separate per-account preference stored
  // anywhere. `name`/`dob` are this template's original unwired demo fields (no backing API), kept
  // as-is aside from translation.
  const languageOptions = [
    { label: t('account.form.languageEnglish'), value: Language.EN },
    { label: t('account.form.languageVietnamese'), value: Language.VI },
  ] as const;

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: { name: '', language },
  });

  function onSubmit(data: AccountFormValues) {
    showSubmittedData(data);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('account.form.name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('account.form.namePlaceholder')} {...field} />
              </FormControl>
              <FormDescription>{t('account.form.nameDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dob"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('account.form.dob')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant={'outline'} className={cn('w-[240px] pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}>
                      {field.value ? format(field.value, 'MMM d, yyyy') : <span>{t('account.form.pickDate')}</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date: Date) => date > new Date() || date < new Date('1900-01-01')}
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>{t('account.form.dobDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>{t('account.form.language')}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" role="combobox" className={cn('w-[200px] justify-between', !field.value && 'text-muted-foreground')}>
                      {field.value ? languageOptions.find((option) => option.value === field.value)?.label : t('account.form.selectLanguage')}
                      <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder={t('account.form.searchLanguage')} />
                    <CommandEmpty>{t('account.form.noLanguageFound')}</CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {languageOptions.map((option) => (
                          <CommandItem
                            value={option.label}
                            key={option.value}
                            onSelect={() => {
                              form.setValue('language', option.value);
                              setLanguage(option.value);
                            }}
                          >
                            <CheckIcon className={cn('mr-2 h-4 w-4', option.value === field.value ? 'opacity-100' : 'opacity-0')} />
                            {option.label}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>{t('account.form.languageDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">{t('account.form.update')}</Button>
      </form>
    </Form>
  );
}
