// 프로필 알림 배지 컴포넌트
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getFriendRequests } from '@/services/friendService';
import { getUnreadCount } from '@/services/messageService';
import { Badge } from '@/components/ui/badge';

export function ProfileNotificationBadge() {
  const { user } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotificationCount(0);
      return;
    }

    async function fetchNotifications() {
      try {
        const [friendRequests, unreadMessages] = await Promise.all([
          getFriendRequests().catch(() => []),
          getUnreadCount().catch(() => 0),
        ]);

        const totalCount = friendRequests.length + unreadMessages;
        setNotificationCount(totalCount);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotificationCount(0);
      }
    }

    fetchNotifications();
    
    // 30초마다 알림 갱신
    const interval = setInterval(fetchNotifications, 30000);
    
    // notification-updated 이벤트 리스너 추가 (친구 요청 수락/거절, 쪽지 읽음 시 즉시 갱신)
    const handleNotificationUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener('notification-updated', handleNotificationUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('notification-updated', handleNotificationUpdate);
    };
  }, [user]);

  if (notificationCount === 0) {
    return null;
  }

  return (
    <Badge 
      variant="destructive" 
      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
    >
      {notificationCount > 99 ? '99+' : notificationCount}
    </Badge>
  );
}
