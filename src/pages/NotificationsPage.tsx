import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Bell, BellOff, CheckCheck, MapPin, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasAutoMarked = useRef(false);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['all_notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  // Auto mark all as read when page opens
  useEffect(() => {
    if (!user || hasAutoMarked.current || isLoading) return;
    const unread = notifications.filter((n: any) => !n.is_read);
    if (unread.length > 0) {
      hasAutoMarked.current = true;
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .then(() => {
          qc.invalidateQueries({ queryKey: ['all_notifications'] });
          qc.invalidateQueries({ queryKey: ['unread_notifications_count'] });
        });
    }
  }, [user, notifications, isLoading, qc]);

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['all_notifications'] });
    qc.invalidateQueries({ queryKey: ['unread_notifications_count'] });
  };

  // Group notifications by day
  const grouped = notifications.reduce<Record<string, any[]>>((acc, notif: any) => {
    const date = new Date(notif.created_at);
    let key = 'Lebih lama';
    if (isToday(date)) key = 'Hari ini';
    else if (isYesterday(date)) key = 'Kemarin';
    if (!acc[key]) acc[key] = [];
    acc[key].push(notif);
    return acc;
  }, {});

  const groupOrder = ['Hari ini', 'Kemarin', 'Lebih lama'];

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-base font-bold">Notifikasi</h1>
          </div>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-destructive hover:text-destructive h-8"
              onClick={async () => {
                await supabase.from('notifications').delete().eq('user_id', user!.id);
                qc.invalidateQueries({ queryKey: ['all_notifications'] });
                qc.invalidateQueries({ queryKey: ['unread_notifications_count'] });
              }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus semua
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 py-3 max-w-lg mx-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-start gap-3 p-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BellOff className="h-8 w-8 opacity-40" />
            </div>
            <p className="text-sm font-semibold">Tidak ada notifikasi</p>
            <p className="text-xs mt-1">Notifikasi baru akan muncul di sini</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groupOrder.map(group => {
              const items = grouped[group];
              if (!items || items.length === 0) return null;
              return (
                <div key={group}>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">{group}</p>
                  <div className="space-y-1.5">
                    {items.map((notif: any) => {
                      // Parse emoji from message start
                      const emojiMatch = notif.message?.match(/^([\p{Emoji_Presentation}\p{Extended_Pictographic}]+)\s*/u);
                      const emoji = emojiMatch ? emojiMatch[1] : null;
                      const messageText = emoji ? notif.message.replace(emojiMatch[0], '') : notif.message;

                      return (
                        <div
                          key={notif.id}
                          className="flex items-start gap-3 p-3 rounded-xl bg-card hover:bg-muted/50 transition-colors group"
                        >
                          {/* Icon */}
                          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                            {emoji ? (
                              <span className="text-base">{emoji}</span>
                            ) : (
                              <Bell className="h-4 w-4 text-primary" />
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] text-foreground leading-snug">{messageText}</p>
                            <p className="text-[10px] text-muted-foreground mt-1">
                              {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: localeId })}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {notif.message?.includes('lokasi') && (
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/location')}>
                                <MapPin className="h-3.5 w-3.5 text-primary" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/50 hover:text-destructive" onClick={() => deleteNotification(notif.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav role={user?.role === 'babysitter' ? 'babysitter' : 'parent'} />
    </div>
  );
};

export default NotificationsPage;
