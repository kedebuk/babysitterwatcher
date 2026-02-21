import { MOCK_DAILY_LOGS, MOCK_CHILDREN, MOCK_ASSIGNMENTS, getEventsForLog, getTotalSusu } from '@/lib/mock-data';
import { ACTIVITY_ICONS, ACTIVITY_BADGE_CLASS } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { ChevronLeft, Calendar } from 'lucide-react';

const BabysitterHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const assignedChildIds = MOCK_ASSIGNMENTS
    .filter(a => a.babysitter_user_id === user?.id)
    .map(a => a.child_id);

  const logs = MOCK_DAILY_LOGS
    .filter(l => assignedChildIds.includes(l.child_id))
    .sort((a, b) => b.log_date.localeCompare(a.log_date));

  return (
    <div className="min-h-screen pb-6">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate('/babysitter/today')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold">Riwayat</h1>
            <p className="text-xs opacity-80">Log harian sebelumnya</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto">
        {logs.map(log => {
          const child = MOCK_CHILDREN.find(c => c.id === log.child_id);
          const events = getEventsForLog(log.id);
          const totalSusu = getTotalSusu(events);

          return (
            <Card key={log.id} className="border-0 shadow-sm animate-fade-in">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-bold">
                      {format(parseISO(log.log_date), 'EEEE, d MMM yyyy', { locale: idLocale })}
                    </span>
                  </div>
                  <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                    {child?.avatar_emoji} {child?.name}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {events.slice(0, 8).map(event => (
                    <span key={event.id} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ACTIVITY_BADGE_CLASS[event.type]}`}>
                      {ACTIVITY_ICONS[event.type]} {event.time}
                    </span>
                  ))}
                  {events.length > 8 && <span className="text-xs text-muted-foreground px-2">+{events.length - 8} lagi</span>}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>🍼 {totalSusu} ml</span>
                  <span>📋 {events.length} event</span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {logs.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg mb-2">📭</p>
            <p>Belum ada riwayat</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BabysitterHistory;
