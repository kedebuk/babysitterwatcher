import { DailyEvent, Child, ACTIVITY_ICONS, ACTIVITY_LABELS } from '@/types';
import { getEventsForLog, getLogForChildDate, getTotalSusu, getTotalMpasi, getPupPeeCount, getVitaminInfo, getMandiInfo, MOCK_EVENTS, MOCK_DAILY_LOGS } from '@/lib/mock-data';
import { format, parseISO, subDays } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

export function generateWhatsAppText(child: Child, date: string): string {
  const log = getLogForChildDate(child.id, date);
  if (!log) return `Tidak ada data untuk ${child.name} pada ${date}`;

  const events = getEventsForLog(log.id);
  const dayName = format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: idLocale });
  
  let text = `📋 Jadwal ${child.name}\n${dayName}\n\n`;

  events.forEach(event => {
    const icon = ACTIVITY_ICONS[event.type];
    const amountStr = event.amount ? ` ${event.amount} ${event.unit || ''}` : '';
    const statusStr = event.status ? ` ${event.status}` : '';
    text += `${event.time} ${icon} ${event.detail || ACTIVITY_LABELS[event.type]}${amountStr ? '' : ''}${statusStr ? '' : ''}\n`;
  });

  const totalSusu = getTotalSusu(events);
  const totalMpasi = getTotalMpasi(events);
  const { pup, pee } = getPupPeeCount(events);

  text += `\n📊 Ringkasan:\n`;
  text += `🍼 Total susu: ${totalSusu} ml\n`;
  text += `🥣 Total MPASI: ${totalMpasi} ml\n`;
  text += `💩 BAB: ${pup}x | 💧 BAK: ${pee}x\n`;

  if (log.notes) {
    text += `\n📝 Catatan: ${log.notes}`;
  }

  return text;
}

export function getLast7DaysData(childId: string): { date: string; susu: number; mpasi: number; pup: number }[] {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    const log = MOCK_DAILY_LOGS.find(l => l.child_id === childId && l.log_date === date);
    if (log) {
      const events = MOCK_EVENTS.filter(e => e.daily_log_id === log.id);
      result.push({
        date: format(parseISO(date), 'd MMM', { locale: idLocale }),
        susu: getTotalSusu(events),
        mpasi: getTotalMpasi(events),
        pup: events.filter(e => e.type === 'pup').length,
      });
    } else {
      result.push({
        date: format(parseISO(date), 'd MMM', { locale: idLocale }),
        susu: 0,
        mpasi: 0,
        pup: 0,
      });
    }
  }
  return result;
}
