// Activity types enum
export type ActivityType = 
  | 'susu'
  | 'mpasi'
  | 'tidur'
  | 'bangun'
  | 'pup'
  | 'pee'
  | 'mandi'
  | 'vitamin'
  | 'lap_badan'
  | 'catatan';

export type EventStatus = 'habis' | 'sisa' | null;
export type EventUnit = 'ml' | 'pcs' | 'dosis' | null;
export type UserRole = 'parent' | 'babysitter';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface Child {
  id: string;
  parent_id: string;
  name: string;
  dob: string;
  notes?: string;
  avatar_emoji?: string;
}

export interface DailyLog {
  id: string;
  child_id: string;
  log_date: string;
  notes?: string;
}

export interface DailyEvent {
  id: string;
  daily_log_id: string;
  time: string; // HH:MM
  type: ActivityType;
  detail?: string;
  amount?: number;
  unit?: EventUnit;
  status?: EventStatus;
}

export interface Assignment {
  id: string;
  child_id: string;
  babysitter_user_id: string;
}

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  susu: 'Susu/Formula',
  mpasi: 'MPASI/Makan',
  tidur: 'Tidur',
  bangun: 'Bangun',
  pup: 'BAB (Pup)',
  pee: 'BAK (Pee)',
  mandi: 'Mandi',
  vitamin: 'Vitamin/Obat',
  lap_badan: 'Lap Badan',
  catatan: 'Catatan Lain',
};

export const ACTIVITY_ICONS: Record<ActivityType, string> = {
  susu: '🍼',
  mpasi: '🥣',
  tidur: '😴',
  bangun: '☀️',
  pup: '💩',
  pee: '💧',
  mandi: '🛁',
  vitamin: '💊',
  lap_badan: '🧴',
  catatan: '📝',
};

export const ACTIVITY_BADGE_CLASS: Record<ActivityType, string> = {
  susu: 'activity-badge-susu',
  mpasi: 'activity-badge-makan',
  tidur: 'activity-badge-tidur',
  bangun: 'activity-badge-tidur',
  pup: 'activity-badge-pup',
  pee: 'activity-badge-pup',
  mandi: 'activity-badge-mandi',
  vitamin: 'activity-badge-vitamin',
  lap_badan: 'activity-badge-mandi',
  catatan: 'activity-badge-other',
};
