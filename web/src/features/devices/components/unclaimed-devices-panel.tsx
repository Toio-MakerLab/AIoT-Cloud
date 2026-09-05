import { IconEyeOff, IconPlus } from '@tabler/icons-react';
import { formatDistanceToNow, type Locale } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Language } from '@/context/language-context';
import { useIsGuest } from '@/hooks/use-is-guest';
import { useIgnoreUnclaimedDeviceMutation, useUnclaimedDevicesQuery, useUnignoreUnclaimedDeviceMutation } from '../api/queries';
import { useDevices } from '../context/devices-context';

const DATE_FNS_LOCALES: Record<Language, Locale> = { [Language.EN]: enUS, [Language.VI]: vi };

export function UnclaimedDevicesPanel() {
  const { t, i18n } = useTranslation('devices');
  const [showIgnored, setShowIgnored] = useState(false);
  const { data } = useUnclaimedDevicesQuery({ includeIgnored: showIgnored });
  const { setOpen, setPrefillDeviceId } = useDevices();
  const ignoreDevice = useIgnoreUnclaimedDeviceMutation();
  const unignoreDevice = useUnignoreUnclaimedDeviceMutation();
  const isGuest = useIsGuest();
  const unclaimedDevices = data?.data ?? [];
  const visibleCount = unclaimedDevices.filter((device) => !device.ignoredAt).length;

  // This panel exists solely to register/ignore unclaimed devices — write actions GUEST can't perform.
  if (isGuest || (unclaimedDevices.length === 0 && !showIgnored)) {
    return null;
  }

  const handleRegister = (deviceId: string) => {
    setPrefillDeviceId(deviceId);
    setOpen('add');
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              {t('unclaimedPanel.title')}
              <Badge variant="secondary">{visibleCount}</Badge>
            </CardTitle>
            <CardDescription>{t('unclaimedPanel.description')}</CardDescription>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Switch id="unclaimed-show-ignored" checked={showIgnored} onCheckedChange={setShowIgnored} />
            <label htmlFor="unclaimed-show-ignored">{t('unclaimedPanel.showIgnored')}</label>
          </div>
        </div>
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
                  {device.ignoredAt ? (
                    <Badge variant="outline" className="mr-2">
                      {t('unclaimedPanel.ignored')}
                    </Badge>
                  ) : null}
                  {device.ignoredAt ? (
                    <Button size="sm" variant="outline" onClick={() => unignoreDevice.mutate(device.deviceId)} disabled={unignoreDevice.isPending}>
                      {t('unclaimedPanel.unignore')}
                    </Button>
                  ) : (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleRegister(device.deviceId)}>
                        <IconPlus className="size-4" />
                        {t('unclaimedPanel.register')}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ml-2"
                        onClick={() => ignoreDevice.mutate(device.deviceId)}
                        disabled={ignoreDevice.isPending}
                      >
                        <IconEyeOff className="size-4" />
                        {t('unclaimedPanel.ignore')}
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
