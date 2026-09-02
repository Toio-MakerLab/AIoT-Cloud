import { IconBell } from '@tabler/icons-react';
import { formatDistanceToNow, type Locale } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Language } from '@/context/language-context';
import {
  useMarkAllNotificationsAsReadMutation,
  useMarkNotificationAsReadMutation,
  useNotificationMessagesQuery,
  useUnreadNotificationCountQuery,
} from '@/features/notifications/api/queries';
import type { INotificationMessage, NotificationChannel } from '@/features/notifications/api/types';
import { cn } from '@/lib/utils';

const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  ZALO: 'Zalo',
  WEB_PUSH: 'Web Push',
};

const DATE_FNS_LOCALES: Record<Language, Locale> = { [Language.EN]: enUS, [Language.VI]: vi };

/** One row in the popover's message list — click marks it read, a dot/weight shows unread state. */
function NotificationItem({ message, onRead }: { message: INotificationMessage; onRead: (id: string) => void }) {
  const { t, i18n } = useTranslation('notifications');
  return (
    <button
      type="button"
      onClick={() => !message.isRead && onRead(message.id)}
      className={cn(
        'hover:bg-accent flex w-full flex-col gap-1 border-b px-4 py-3 text-left text-sm transition-colors last:border-b-0',
        !message.isRead && 'bg-accent/40',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">{CHANNEL_LABELS[message.channel]}</span>
        <span className="text-muted-foreground shrink-0 text-xs">
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true, locale: DATE_FNS_LOCALES[i18n.language as Language] })}
        </span>
      </div>
      <p className={cn('line-clamp-2 break-words', !message.isRead && 'font-medium')}>{message.message}</p>
      {message.status === 'FAILED' && (
        <Badge variant="destructive" className="w-fit">
          {t('nav.failedToDeliver')}
        </Badge>
      )}
    </button>
  );
}

/** Header bell — polls the unread count (see queries.ts) and lazily loads the recent inbox once opened. */
export function NotificationsNav() {
  const { t } = useTranslation('notifications');
  const [open, setOpen] = useState(false);

  const { data: unreadCountResponse } = useUnreadNotificationCountQuery();
  const unreadCount = unreadCountResponse?.data?.count ?? 0;

  const { data: messagesResponse, isLoading } = useNotificationMessagesQuery({ take: 10 }, { enabled: open });
  const messages = messagesResponse?.data ?? [];

  const markAsRead = useMarkNotificationAsReadMutation();
  const markAllAsRead = useMarkAllNotificationsAsReadMutation();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative scale-95 rounded-full">
          <IconBell className="size-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px] leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className="sr-only">{t('nav.title')}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-medium">{t('nav.title')}</p>
          {unreadCount > 0 && (
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => markAllAsRead.mutate()} disabled={markAllAsRead.isPending}>
              {t('nav.markAllAsRead')}
            </Button>
          )}
        </div>
        <ScrollArea className="h-80 border-t">
          {isLoading ? (
            <p className="text-muted-foreground px-4 py-6 text-center text-sm">{t('nav.loading')}</p>
          ) : messages.length === 0 ? (
            <p className="text-muted-foreground px-4 py-6 text-center text-sm">{t('nav.caughtUp')}</p>
          ) : (
            messages.map((message) => <NotificationItem key={message.id} message={message} onRead={(id) => markAsRead.mutate(id)} />)
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
