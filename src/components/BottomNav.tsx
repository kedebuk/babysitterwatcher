import { useLocation, useNavigate } from 'react-router-dom';
import { Home, PenLine, MessageCircle, User, History, Bell, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badgeKey?: 'notifications' | 'unread_messages';
}

const PARENT_ITEMS: NavItem[] = [
  { icon: Home, label: 'Dashboard', path: '/parent/dashboard' },
  { icon: PenLine, label: 'Input', path: '/parent/input' },
  { icon: Package, label: 'Stok', path: '/inventory' },
  { icon: MessageCircle, label: 'Chat', path: '/chat', badgeKey: 'unread_messages' },
  { icon: User, label: 'Profil', path: '/profile', badgeKey: 'notifications' },
];

const BABYSITTER_ITEMS: NavItem[] = [
  { icon: PenLine, label: 'Input', path: '/babysitter/today' },
  { icon: Package, label: 'Stok', path: '/inventory' },
  { icon: MessageCircle, label: 'Chat', path: '/chat', badgeKey: 'unread_messages' },
  { icon: User, label: 'Profil', path: '/profile', badgeKey: 'notifications' },
];

interface BottomNavProps {
  role: 'parent' | 'babysitter';
}

export function BottomNav({ role }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const items = role === 'parent' ? PARENT_ITEMS : BABYSITTER_ITEMS;

  // Unread messages count
  const { data: unreadMessages = 0 } = useQuery({
    queryKey: ['unread_messages_count', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user!.id)
        .eq('is_read', false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  // Unread notifications count
  const { data: unreadNotifications = 0 } = useQuery({
    queryKey: ['unread_notifications_count', user?.id],
    queryFn: async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_read', false);
      return count || 0;
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  const getBadgeCount = (key?: string) => {
    if (key === 'unread_messages') return unreadMessages;
    if (key === 'notifications') return unreadNotifications;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t safe-area-bottom">
      <div className="max-w-2xl mx-auto flex">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          const badgeCount = getBadgeCount(item.badgeKey);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 pt-2.5 text-[10px] font-medium transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold px-1">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}