import { useState } from 'react';
import { MOCK_CHILDREN, MOCK_EVENTS, getEventsForLog, getLogForChildDate, getTotalSusu, getTotalMpasi, getPupPeeCount, getVitaminInfo, getMandiInfo } from '@/lib/mock-data';
import { generateWhatsAppText, getLast7DaysData } from '@/lib/whatsapp';
import { ACTIVITY_ICONS, ACTIVITY_LABELS, ACTIVITY_BADGE_CLASS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Baby, Droplets, UtensilsCrossed, Bath, Pill, Copy, LogOut, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';

const ParentDashboard = () => {
  const [selectedChild, setSelectedChild] = useState(MOCK_CHILDREN[0]?.id || '');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const child = MOCK_CHILDREN.find(c => c.id === selectedChild);
  const log = child ? getLogForChildDate(child.id, selectedDate) : undefined;
  const events = log ? getEventsForLog(log.id) : [];

  const totalSusu = getTotalSusu(events);
  const totalMpasi = getTotalMpasi(events);
  const { pup, pee } = getPupPeeCount(events);
  const vitaminInfo = getVitaminInfo(events);
  const mandiInfo = getMandiInfo(events);
  const chartData = child ? getLast7DaysData(child.id) : [];

  const handleCopyWhatsApp = () => {
    if (!child) return;
    const text = generateWhatsAppText(child, selectedDate);
    navigator.clipboard.writeText(text);
    toast({ title: '✅ Disalin!', description: 'Format WhatsApp sudah di-copy ke clipboard' });
  };

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(format(d, 'yyyy-MM-dd'));
  };

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Dashboard</h1>
            <p className="text-xs opacity-80">Halo, {user?.name} 👋</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate('/parent/children')}>
              <Users className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4 max-w-2xl mx-auto">
        {/* Filters */}
        <div className="flex gap-2">
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="flex-1 h-11 bg-card">
              <SelectValue placeholder="Pilih anak" />
            </SelectTrigger>
            <SelectContent>
              {MOCK_CHILDREN.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.avatar_emoji} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date nav */}
        <div className="flex items-center justify-between bg-card rounded-lg px-3 py-2">
          <Button variant="ghost" size="icon" onClick={() => changeDate(-1)}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="text-center">
            <p className="font-semibold text-sm">
              {format(parseISO(selectedDate), 'EEEE, d MMMM yyyy', { locale: idLocale })}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => changeDate(1)}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-susu text-sm">🍼</div>
                <span className="text-xs text-muted-foreground">Total Susu</span>
              </div>
              <p className="text-2xl font-bold">{totalSusu} <span className="text-sm font-normal text-muted-foreground">ml</span></p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-makan text-sm">🥣</div>
                <span className="text-xs text-muted-foreground">Total MPASI</span>
              </div>
              <p className="text-2xl font-bold">{totalMpasi} <span className="text-sm font-normal text-muted-foreground">ml</span></p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-pup text-sm">💩</div>
                <span className="text-xs text-muted-foreground">BAB / BAK</span>
              </div>
              <p className="text-2xl font-bold">{pup} <span className="text-sm font-normal text-muted-foreground">/ {pee}x</span></p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-vitamin text-sm">💊</div>
                <span className="text-xs text-muted-foreground">Vitamin</span>
              </div>
              <p className="text-lg font-bold">{vitaminInfo.given ? `✅ ${vitaminInfo.time}` : '❌ Belum'}</p>
            </CardContent>
          </Card>
        </div>

        {/* Mandi info */}
        {mandiInfo.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg activity-badge-mandi text-sm">🛁</div>
                <span className="text-sm font-semibold">Mandi / Lap Badan</span>
              </div>
              <p className="text-sm text-muted-foreground">{mandiInfo.join(' • ')}</p>
            </CardContent>
          </Card>
        )}

        {/* Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 px-3 pt-3">
            <CardTitle className="text-sm font-semibold">📈 Grafik 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="susu" name="Susu (ml)" fill="hsl(210, 75%, 55%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mpasi" name="MPASI (ml)" fill="hsl(25, 85%, 55%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pup" name="BAB" fill="hsl(145, 55%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Timeline */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-sm">📋 Timeline Harian</h2>
            <Button size="sm" variant="outline" className="h-8 text-xs" onClick={handleCopyWhatsApp}>
              <Copy className="h-3.5 w-3.5 mr-1" /> Copy WhatsApp
            </Button>
          </div>

          {events.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center text-muted-foreground">
                Belum ada data untuk tanggal ini
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {events.map(event => (
                <Card key={event.id} className="border-0 shadow-sm animate-fade-in">
                  <CardContent className="p-3 flex items-start gap-3">
                    <div className="text-center min-w-[44px]">
                      <p className="text-xs font-bold text-muted-foreground">{event.time}</p>
                    </div>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${ACTIVITY_BADGE_CLASS[event.type]}`}>
                      {ACTIVITY_ICONS[event.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{ACTIVITY_LABELS[event.type]}</p>
                      {event.detail && <p className="text-xs text-muted-foreground truncate">{event.detail}</p>}
                    </div>
                    {event.amount && (
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold">{event.amount}</p>
                        <p className="text-xs text-muted-foreground">{event.unit}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        {log?.notes && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-1">📝 Catatan Harian</p>
              <p className="text-sm">{log.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ParentDashboard;
