import { useTranslation } from 'react-i18next';
import ContentSection from '../components/content-section';
import { AccountForm } from './account-form';
import { DangerZone } from './danger-zone';

export default function SettingsAccount() {
  const { t } = useTranslation('settings');
  return (
    <ContentSection title={t('account.title')} desc={t('account.description')}>
      <div className="space-y-8">
        <AccountForm />
        <DangerZone />
      </div>
    </ContentSection>
  );
}
