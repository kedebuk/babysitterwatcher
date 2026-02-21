import { Child, DailyEvent, DailyLog, User, Assignment } from '@/types';

// Mock users
export const MOCK_USERS: User[] = [
  { id: 'u1', email: 'mama@example.com', role: 'parent', name: 'Mama Sarah' },
  { id: 'u2', email: 'sitter@example.com', role: 'babysitter', name: 'Mbak Ani' },
];

// Mock children
export const MOCK_CHILDREN: Child[] = [
  { id: 'c1', parent_id: 'u1', name: 'Eleanor', dob: '2025-06-15', notes: 'Alergi kacang', avatar_emoji: '👶' },
  { id: 'c2', parent_id: 'u1', name: 'Raffi', dob: '2024-01-20', notes: '', avatar_emoji: '🧒' },
];

// Mock assignments
export const MOCK_ASSIGNMENTS: Assignment[] = [
  { id: 'a1', child_id: 'c1', babysitter_user_id: 'u2' },
  { id: 'a2', child_id: 'c2', babysitter_user_id: 'u2' },
];

// Mock daily log for Eleanor - Feb 21 2026 (from WhatsApp format)
export const MOCK_DAILY_LOGS: DailyLog[] = [
  { id: 'dl1', child_id: 'c1', log_date: '2026-02-21', notes: 'Eleanor hari ini aktif dan ceria' },
  { id: 'dl2', child_id: 'c1', log_date: '2026-02-20', notes: '' },
];

export const MOCK_EVENTS: DailyEvent[] = [
  // Feb 21
  { id: 'e1', daily_log_id: 'dl1', time: '04:10', type: 'susu', detail: 'Susu 30 ml habis', amount: 30, unit: 'ml', status: 'habis' },
  { id: 'e2', daily_log_id: 'dl1', time: '06:00', type: 'bangun', detail: 'Bangun tidur', amount: undefined, unit: null, status: null },
  { id: 'e3', daily_log_id: 'dl1', time: '06:30', type: 'mandi', detail: 'Mandi pagi', amount: undefined, unit: null, status: null },
  { id: 'e4', daily_log_id: 'dl1', time: '07:00', type: 'susu', detail: 'Susu 50 ml habis', amount: 50, unit: 'ml', status: 'habis' },
  { id: 'e5', daily_log_id: 'dl1', time: '08:00', type: 'mpasi', detail: 'Bubur 150 ml + ikan bawal kecap jahe', amount: 150, unit: 'ml', status: 'habis' },
  { id: 'e6', daily_log_id: 'dl1', time: '09:00', type: 'vitamin', detail: 'Vitamin D 1 dosis', amount: 1, unit: 'dosis', status: null },
  { id: 'e7', daily_log_id: 'dl1', time: '09:30', type: 'tidur', detail: 'Tidur pagi', amount: undefined, unit: null, status: null },
  { id: 'e8', daily_log_id: 'dl1', time: '11:00', type: 'bangun', detail: 'Bangun tidur', amount: undefined, unit: null, status: null },
  { id: 'e9', daily_log_id: 'dl1', time: '11:30', type: 'pup', detail: 'BAB normal', amount: undefined, unit: null, status: null },
  { id: 'e10', daily_log_id: 'dl1', time: '12:00', type: 'mpasi', detail: 'Nasi tim 200 ml + ayam wortel', amount: 200, unit: 'ml', status: 'habis' },
  { id: 'e11', daily_log_id: 'dl1', time: '13:00', type: 'susu', detail: 'Susu 30 ml sisa 10 ml', amount: 20, unit: 'ml', status: 'sisa' },
  { id: 'e12', daily_log_id: 'dl1', time: '14:00', type: 'pee', detail: 'BAK', amount: undefined, unit: null, status: null },
  { id: 'e13', daily_log_id: 'dl1', time: '15:00', type: 'lap_badan', detail: 'Lap badan sore', amount: undefined, unit: null, status: null },
  // Feb 20
  { id: 'e20', daily_log_id: 'dl2', time: '05:00', type: 'susu', detail: 'Susu 40 ml habis', amount: 40, unit: 'ml', status: 'habis' },
  { id: 'e21', daily_log_id: 'dl2', time: '08:00', type: 'mpasi', detail: 'Bubur 120 ml', amount: 120, unit: 'ml', status: 'habis' },
  { id: 'e22', daily_log_id: 'dl2', time: '10:00', type: 'susu', detail: 'Susu 50 ml habis', amount: 50, unit: 'ml', status: 'habis' },
  { id: 'e23', daily_log_id: 'dl2', time: '12:00', type: 'mpasi', detail: 'Nasi 180 ml', amount: 180, unit: 'ml', status: 'habis' },
  { id: 'e24', daily_log_id: 'dl2', time: '14:00', type: 'pup', detail: 'BAB', amount: undefined, unit: null, status: null },
  { id: 'e25', daily_log_id: 'dl2', time: '09:00', type: 'vitamin', detail: 'Vitamin D', amount: 1, unit: 'dosis', status: null },
];

// Helper functions
export function getEventsForLog(logId: string): DailyEvent[] {
  return MOCK_EVENTS.filter(e => e.daily_log_id === logId).sort((a, b) => a.time.localeCompare(b.time));
}

export function getLogForChildDate(childId: string, date: string): DailyLog | undefined {
  return MOCK_DAILY_LOGS.find(l => l.child_id === childId && l.log_date === date);
}

export function getTotalSusu(events: DailyEvent[]): number {
  return events.filter(e => e.type === 'susu' && e.amount).reduce((sum, e) => sum + (e.amount || 0), 0);
}

export function getTotalMpasi(events: DailyEvent[]): number {
  return events.filter(e => e.type === 'mpasi' && e.amount).reduce((sum, e) => sum + (e.amount || 0), 0);
}

export function getPupPeeCount(events: DailyEvent[]): { pup: number; pee: number } {
  return {
    pup: events.filter(e => e.type === 'pup').length,
    pee: events.filter(e => e.type === 'pee').length,
  };
}

export function getVitaminInfo(events: DailyEvent[]): { given: boolean; time?: string } {
  const vit = events.find(e => e.type === 'vitamin');
  return { given: !!vit, time: vit?.time };
}

export function getMandiInfo(events: DailyEvent[]): string[] {
  return events.filter(e => e.type === 'mandi' || e.type === 'lap_badan').map(e => `${e.time} ${e.type === 'mandi' ? 'Mandi' : 'Lap badan'}`);
}
