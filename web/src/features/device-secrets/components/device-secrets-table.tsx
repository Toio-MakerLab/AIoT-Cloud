import { IconBan } from '@tabler/icons-react';
import { formatDistanceToNow, type Locale } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Language } from '@/context/language-context';
import { useRevokeDeviceSecretMutation } from '../api/queries';
import type { IDeviceSecret } from '../api/types';

interface Props {
  data: IDeviceSecret[];
}

const DATE_FNS_LOCALES: Record<Language, Locale> = { [Language.EN]: enUS, [Language.VI]: vi };

export function DeviceSecretsTable({ data }: Props) {
  const { t, i18n } = useTranslation('deviceSecrets');
  const revokeDeviceSecret = useRevokeDeviceSecretMutation();

  const handleRevoke = async (id: string) => {
    try {
      await revokeDeviceSecret.mutateAsync(id);
      toast.success(t('table.revoked'));
    } catch {
      // Error toast is already shown by the global mutation error handler (see main.tsx).
    }
  };

  if (data.length === 0) {
    return <p className="text-muted-foreground py-8 text-center text-sm">{t('table.empty')}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('table.label')}</TableHead>
          <TableHead>{t('table.status')}</TableHead>
          <TableHead>{t('table.created')}</TableHead>
          <TableHead className="w-0" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((secret) => {
          const isRevoked = !!secret.revokedAt;

          return (
            <TableRow key={secret.id}>
              <TableCell className="font-medium">{secret.label || <span className="text-muted-foreground">{t('table.untitled')}</span>}</TableCell>
              <TableCell>
                <Badge variant={isRevoked ? 'outline' : 'default'}>{isRevoked ? t('table.revokedBadge') : t('table.activeBadge')}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(secret.createdAt), {
                  addSuffix: true,
                  locale: DATE_FNS_LOCALES[i18n.language as Language],
                })}
              </TableCell>
              <TableCell>
                {!isRevoked && (
                  <Button variant="ghost" size="sm" onClick={() => void handleRevoke(secret.id)} disabled={revokeDeviceSecret.isPending}>
                    <IconBan className="mr-1 h-4 w-4" />
                    {t('table.revoke')}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
