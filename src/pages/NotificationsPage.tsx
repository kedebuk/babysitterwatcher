import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Bell, BellOff, CheckCheck, MapPin, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

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
    if (user && notifications.length > 0 && notifications.some((n: any) => !n.is_read)) {
      supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
        .then(() => {
          qc.invalidateQueries({ queryKey: ['unread_notifications_count'] });
        });
    }
  }, [user, notifications]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['all_notifications'] });
    qc.invalidateQueries({ queryKey: ['unread_notifications_count'] });
  };

  const markAllAsRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user!.id)
      .eq('is_read', false);
    qc.invalidateQueries({ queryKey: ['all_notifications'] });
    qc.invalidateQueries({ queryKey: ['unread_notifications_count'] });
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['all_notifications'] });
    qc.invalidateQueries({ queryKey: ['unread_notifications_count'] });
  };

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return (
    <div className="min-h-screen pb-24 bg-background">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">Notifikasi</h1>
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/20 text-xs gap-1.5" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4" /> Tandai semua dibaca
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 py-4 max-w-lg mx-auto space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">Memuat...</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <BellOff className="h-12 w-12 mb-3 opacity-40" />
            <p className="text-sm font-medium">Belum ada notifikasi</p>
          </div>
        ) : (
          notifications.map((notif: any) => (
            <Card
              key={notif.id}
              className={cn(
                'border-0 shadow-sm transition-all',
                !notif.is_read && 'border-l-4 border-l-primary bg-primary/5'
              )}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    notif.is_read ? 'bg-muted' : 'bg-primary/15'
                  )}>
                    <Bell className={cn('h-4 w-4', notif.is_read ? 'text-muted-foreground' : 'text-primary')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm', !notif.is_read && 'font-semibold')}>{notif.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: localeId })}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {notif.message?.includes('lokasi') && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate('/location')}>
                        <MapPin className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    )}
                    {!notif.is_read && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => markAsRead(notif.id)}>
                        <CheckCheck className="h-3.5 w-3.5 text-primary" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteNotification(notif.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <BottomNav role={user?.role === 'babysitter' ? 'babysitter' : 'parent'} />
    </div>
  );
};

export default NotificationsPage;
