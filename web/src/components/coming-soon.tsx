import { IconPlanet } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export default function ComingSoon() {
  const { t } = useTranslation('nav');
  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <IconPlanet size={72} />
        <h1 className="text-4xl leading-tight font-bold">{t('comingSoon.title')} 👀</h1>
        <p className="text-muted-foreground text-center">
          {t('comingSoon.line1')} <br />
          {t('comingSoon.line2')}
        </p>
      </div>
    </div>
  );
}
