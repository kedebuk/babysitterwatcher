import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Bell, BellOff, ChevronDown, MapPin, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, isToday, isYesterday, format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useEffect, useRef, useState } from 'react';
import { ActivityIcon } from '@/components/ActivityIcons';

// Detect activity type from notification message
function detectActivityType(message: string): string | null {
  const m = message.toLowerCase();
  if (m.includes('susu') || m.includes('formula')) return 'susu';
  if (m.includes('mpasi') || m.includes('makan')) return 'mpasi';
  if (m.includes('tidur')) return 'tidur';
  if (m.includes('bangun')) return 'bangun';
  if (m.includes('pup') || m.includes('bab')) return 'pup';
  if (m.includes('pee') || m.includes('bak')) return 'pee';
  if (m.includes('mandi')) return 'mandi';
  if (m.includes('lap badan')) return 'lap_badan';
  if (m.includes('vitamin') || m.includes('obat')) return 'vitamin';
  if (m.includes('snack')) return 'snack';
  if (m.includes('buah')) return 'buah';
  if (m.includes('catatan')) return 'catatan';
  if (m.includes('lokasi')) return 'location';
  return null;
}

const NotificationsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const hasAutoMarked = useRef(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['all_notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);
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

  const deleteAll = async () => {
    await supabase.from('notifications').delete().eq('user_id', user!.id);
    qc.invalidateQueries({ queryKey: ['all_notifications'] });
    qc.invalidateQueries({ queryKey: ['unread_notifications_count'] });
  };

  // Group notifications by date string
  const grouped = notifications.reduce<Record<string, any[]>>((acc, notif: any) => {
    const date = new Date(notif.created_at);
    let key: string;
    if (isToday(date)) key = 'Hari ini';
    else if (isYesterday(date)) key = 'Kemarin';
    else key = format(date, 'd MMMM yyyy', { locale: localeId });
    if (!acc[key]) acc[key] = [];
    acc[key].push(notif);
    return acc;
  }, {});

  const groupKeys = Object.keys(grouped);

  // Auto-expand "Hari ini" on first load
  useEffect(() => {
    if (groupKeys.length > 0 && Object.keys(expandedGroups).length === 0) {
      setExpandedGroups({ [groupKeys[0]]: true });
    }
  }, [groupKeys.length]); // eslint-disable-line

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
  };

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
            <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive h-8" onClick={deleteAll}>
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Hapus semua
            </Button>
          )}
        </div>
      </div>

      <div className="px-4 py-3 max-w-lg mx-auto">
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i}>
                <Skeleton className="h-10 w-full rounded-xl mb-2" />
                <Skeleton className="h-14 w-full rounded-xl" />
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
          <div className="space-y-2">
            {groupKeys.map(group => {
              const items = grouped[group];
              const isExpanded = expandedGroups[group] || false;
              // Count unique activity types for summary
              const typeSummary: Record<string, number> = {};
              items.forEach((n: any) => {
                const t = detectActivityType(n.message) || 'other';
                typeSummary[t] = (typeSummary[t] || 0) + 1;
              });

              return (
                <div key={group}>
                  {/* Day header - clickable */}
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center justify-between bg-card rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <Bell className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">{group}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[11px] text-muted-foreground">{items.length} notifikasi</span>
                          {!isExpanded && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              ·
                              {Object.entries(typeSummary).slice(0, 5).map(([type, count]) => (
                                <span key={type} className="inline-flex items-center gap-0.5">
                                  {type !== 'other' && type !== 'location' ? <ActivityIcon type={type} size={12} /> : null}
                                  {count}
                                </span>
                              ))}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', isExpanded && 'rotate-180')} />
                  </button>

                  {/* Expanded notification list */}
                  {isExpanded && (
                    <div className="mt-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      {items.map((notif: any) => {
                        const actType = detectActivityType(notif.message);
                        const time = format(new Date(notif.created_at), 'HH:mm');

                        return (
                          <div
                            key={notif.id}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors group"
                          >
                            {/* Time */}
                            <span className="text-[11px] font-mono text-muted-foreground w-[36px] shrink-0">{time}</span>

                            {/* Activity icon */}
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                              {actType && actType !== 'location' ? (
                                <ActivityIcon type={actType} size={18} />
                              ) : actType === 'location' ? (
                                <MapPin className="h-4 w-4 text-primary" />
                              ) : (
                                <Bell className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>

                            {/* Message */}
                            <p className="flex-1 text-[13px] text-foreground truncate min-w-0">{notif.message}</p>

                            {/* Delete on hover */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive"
                              onClick={() => deleteNotification(notif.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
