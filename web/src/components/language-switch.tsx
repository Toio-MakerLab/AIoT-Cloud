import { IconCheck, IconLanguage } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Language, useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';

export function LanguageSwitch() {
  const { t } = useTranslation('nav');
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="scale-95 rounded-full">
          <IconLanguage className="size-[1.2rem]" />
          <span className="sr-only">{t('themeSwitch.toggleLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setLanguage(Language.EN)}>
          English <IconCheck size={14} className={cn('ml-auto', language !== Language.EN && 'hidden')} />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setLanguage(Language.VI)}>
          Tiếng Việt
          <IconCheck size={14} className={cn('ml-auto', language !== Language.VI && 'hidden')} />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
