import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { domainConfig } from '@/lib/domain-config';
import { useAuthStore } from '@/stores/authStore';
import { invalidateNotificationQueries } from '../api/queries';

interface NotificationCreatedEvent {
  userId: string;
  message: string;
  deviceId: string | null;
  occurredAt: string;
}

/**
 * App-wide, mounted once in routes/__root.tsx (not per-feature) so an alert toasts no matter which
 * page is open — unlike the dashboard's per-page telemetry socket (see
 * features/dashboard/hooks/use-device-socket.ts), this connection must outlive any single route.
 * Every socket joins its own user room server-side on connect (see AppGateway), so this fires for
 * every alert regardless of whether the user has a ZALO/WEB_PUSH channel linked.
 */
export function NotificationsListener() {
  const accessToken = useAuthStore((state) => state.auth.accessToken);
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    // See use-device-socket.ts for why this strips VITE_API_URL down to the bare origin.
    const apiUrl = domainConfig.VITE_API_URL || 'http://localhost:3000';
    const origin = (() => {
      try {
        return new URL(apiUrl, window.location.origin).origin;
      } catch {
        return window.location.origin;
      }
    })();

    const socket = io(origin, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    const handleNotification = (event: NotificationCreatedEvent) => {
      toast.warning(event.message);
      invalidateNotificationQueries(queryClient);
    };

    socket.on('notification', handleNotification);

    return () => {
      socket.off('notification', handleNotification);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, queryClient]);

  return null;
}
