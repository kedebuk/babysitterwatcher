import { useState, useCallback } from 'react';
import { MOCK_CHILDREN, MOCK_ASSIGNMENTS, MOCK_EVENTS, MOCK_DAILY_LOGS, getEventsForLog, getLogForChildDate, getTotalSusu } from '@/lib/mock-data';
import { ActivityType, ACTIVITY_LABELS, ACTIVITY_ICONS, ACTIVITY_BADGE_CLASS, DailyEvent, EventUnit, EventStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Plus, Trash2, LogOut, Clock, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ACTIVITY_OPTIONS: ActivityType[] = ['susu', 'mpasi', 'tidur', 'bangun', 'pup', 'pee', 'mandi', 'vitamin', 'lap_badan', 'catatan'];

interface EventRow {
  tempId: string;
  time: string;
  type: ActivityType;
  detail: string;
  amount: string;
  unit: EventUnit;
  status: EventStatus;
}

const createEmptyRow = (): EventRow => ({
  tempId: crypto.randomUUID(),
  time: format(new Date(), 'HH:mm'),
  type: 'susu',
  detail: '',
  amount: '',
  unit: 'ml',
  status: null,
});

const BabysitterToday = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [selectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const assignedChildren = MOCK_CHILDREN.filter(c =>
    MOCK_ASSIGNMENTS.some(a => a.child_id === c.id && a.babysitter_user_id === user?.id)
  );
  const [selectedChild, setSelectedChild] = useState(assignedChildren[0]?.id || '');

  const child = MOCK_CHILDREN.find(c => c.id === selectedChild);
  const log = child ? getLogForChildDate(child.id, selectedDate) : undefined;
  const existingEvents = log ? getEventsForLog(log.id) : [];

  const [newRows, setNewRows] = useState<EventRow[]>([createEmptyRow()]);
  const [notes, setNotes] = useState(log?.notes || '');

  const totalSusu = getTotalSusu(existingEvents);

  const addRow = () => setNewRows(prev => [...prev, createEmptyRow()]);

  const updateRow = (tempId: string, field: keyof EventRow, value: string) => {
    setNewRows(prev => prev.map(r => r.tempId === tempId ? { ...r, [field]: value } : r));
  };

  const removeRow = (tempId: string) => {
    setNewRows(prev => prev.filter(r => r.tempId !== tempId));
  };

  const handleSave = () => {
    toast({ title: '✅ Tersimpan!', description: 'Log harian berhasil disimpan' });
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Input Harian</h1>
            <p className="text-xs opacity-80">Halo, {user?.name} 👋</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate('/babysitter/history')}>
              <History className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 space-y-4 max-w-2xl mx-auto">
        {/* Child selector + date */}
        <div className="flex gap-2">
          <Select value={selectedChild} onValueChange={setSelectedChild}>
            <SelectTrigger className="flex-1 h-11 bg-card">
              <SelectValue placeholder="Pilih anak" />
            </SelectTrigger>
            <SelectContent>
              {assignedChildren.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.avatar_emoji} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="h-11 px-3 flex items-center bg-card rounded-lg text-sm font-medium border">
            📅 {format(new Date(selectedDate), 'd MMM', { locale: idLocale })}
          </div>
        </div>

        {/* Quick summary */}
        <Card className="border-0 shadow-sm bg-secondary">
          <CardContent className="p-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-secondary-foreground">🍼 Total Susu Hari Ini</span>
            <span className="text-lg font-bold text-secondary-foreground">{totalSusu} ml</span>
          </CardContent>
        </Card>

        {/* Existing events */}
        {existingEvents.length > 0 && (
          <div>
            <h2 className="text-sm font-bold mb-2 text-muted-foreground">Event Tercatat</h2>
            <div className="space-y-1.5">
              {existingEvents.map(event => (
                <Card key={event.id} className="border-0 shadow-sm">
                  <CardContent className="p-2.5 flex items-center gap-2.5">
                    <span className="text-xs font-bold text-muted-foreground min-w-[36px]">{event.time}</span>
                    <span className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs ${ACTIVITY_BADGE_CLASS[event.type]}`}>
                      {ACTIVITY_ICONS[event.type]}
                    </span>
                    <span className="text-xs flex-1 truncate">{event.detail || ACTIVITY_LABELS[event.type]}</span>
                    {event.amount && <span className="text-xs font-bold">{event.amount} {event.unit}</span>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* New event input */}
        <div>
          <h2 className="text-sm font-bold mb-2">➕ Tambah Event</h2>
          <div className="space-y-3">
            {newRows.map((row, idx) => (
              <Card key={row.tempId} className="border-0 shadow-sm animate-slide-up">
                <CardContent className="p-3 space-y-2">
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-shrink-0">
                      <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        type="time"
                        value={row.time}
                        onChange={e => updateRow(row.tempId, 'time', e.target.value)}
                        className="w-[100px] h-10 pl-7 text-sm"
                      />
                    </div>
                    <Select value={row.type} onValueChange={v => updateRow(row.tempId, 'type', v)}>
                      <SelectTrigger className="flex-1 h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ACTIVITY_OPTIONS.map(act => (
                          <SelectItem key={act} value={act}>
                            {ACTIVITY_ICONS[act]} {ACTIVITY_LABELS[act]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive shrink-0" onClick={() => removeRow(row.tempId)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <Input
                    placeholder="Detail (mis: susu 30 ml habis)"
                    value={row.detail}
                    onChange={e => updateRow(row.tempId, 'detail', e.target.value)}
                    className="h-10 text-sm"
                  />

                  {(row.type === 'susu' || row.type === 'mpasi' || row.type === 'vitamin') && (
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Jumlah"
                        value={row.amount}
                        onChange={e => updateRow(row.tempId, 'amount', e.target.value)}
                        className="flex-1 h-10 text-sm"
                      />
                      <Select value={row.unit || 'ml'} onValueChange={v => updateRow(row.tempId, 'unit', v)}>
                        <SelectTrigger className="w-[80px] h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="pcs">pcs</SelectItem>
                          <SelectItem value="dosis">dosis</SelectItem>
                        </SelectContent>
                      </Select>
                      {row.type === 'susu' && (
                        <Select value={row.status || ''} onValueChange={v => updateRow(row.tempId, 'status', v as EventStatus)}>
                          <SelectTrigger className="w-[90px] h-10">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="habis">Habis</SelectItem>
                            <SelectItem value="sisa">Sisa</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Button variant="outline" className="w-full h-12 mt-3 border-dashed" onClick={addRow}>
            <Plus className="mr-2 h-5 w-5" /> Tambah Baris
          </Button>
        </div>

        {/* Daily notes */}
        <div>
          <h2 className="text-sm font-bold mb-2">📝 Catatan Harian</h2>
          <Textarea
            placeholder="Catatan tambahan tentang hari ini..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="min-h-[80px] text-sm"
          />
        </div>
      </div>

      {/* Floating save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm border-t max-w-2xl mx-auto">
        <Button className="w-full h-14 text-base font-bold" onClick={handleSave}>
          💾 Simpan Log Hari Ini
        </Button>
      </div>
    </div>
  );
};

export default BabysitterToday;
