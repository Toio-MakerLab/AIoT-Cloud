import { useTranslation } from 'react-i18next';

const SkipToMain = () => {
  const { t } = useTranslation('nav');
  return (
    <a
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground focus:shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
      href="#content"
    >
      {t('skipToMain')}
    </a>
  );
};

export default SkipToMain;
