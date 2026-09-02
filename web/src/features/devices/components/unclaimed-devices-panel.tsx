import { IconPlus } from '@tabler/icons-react';
import { formatDistanceToNow, type Locale } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Language } from '@/context/language-context';
import { useIsGuest } from '@/hooks/use-is-guest';
import { useUnclaimedDevicesQuery } from '../api/queries';
import { useDevices } from '../context/devices-context';

const DATE_FNS_LOCALES: Record<Language, Locale> = { [Language.EN]: enUS, [Language.VI]: vi };

export function UnclaimedDevicesPanel() {
  const { t, i18n } = useTranslation('devices');
  const { data } = useUnclaimedDevicesQuery();
  const { setOpen, setPrefillDeviceId } = useDevices();
  const isGuest = useIsGuest();
  const unclaimedDevices = data?.data ?? [];

  // This panel exists solely to register unclaimed devices — a write action GUEST can't perform.
  if (isGuest || unclaimedDevices.length === 0) {
    return null;
  }

  const handleRegister = (deviceId: string) => {
    setPrefillDeviceId(deviceId);
    setOpen('add');
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('unclaimedPanel.title')}
          <Badge variant="secondary">{unclaimedDevices.length}</Badge>
        </CardTitle>
        <CardDescription>{t('unclaimedPanel.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('unclaimedPanel.deviceId')}</TableHead>
              <TableHead>{t('unclaimedPanel.lastTopic')}</TableHead>
              <TableHead>{t('unclaimedPanel.lastSeen')}</TableHead>
              <TableHead className="text-right">{t('unclaimedPanel.action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unclaimedDevices.map((device) => (
              <TableRow key={device.id}>
                <TableCell className="font-mono text-sm">{device.deviceId}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{device.lastTopic}</TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDistanceToNow(device.lastSeenAt, { addSuffix: true, locale: DATE_FNS_LOCALES[i18n.language as Language] })}
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => handleRegister(device.deviceId)}>
                    <IconPlus className="size-4" />
                    {t('unclaimedPanel.register')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
