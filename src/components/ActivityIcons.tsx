import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

// 🍼 Susu - Milk Bottle (warm blue)
export function SusuIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <rect x="11" y="3" width="10" height="4" rx="1.5" fill="#93C5FD" stroke="#3B82F6" strokeWidth="1.2" />
      <path d="M12 7L10.5 11V26C10.5 27.66 11.84 29 13.5 29H18.5C20.16 29 21.5 27.66 21.5 26V11L20 7H12Z" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5" />
      <rect x="12.5" y="18" width="7" height="9" rx="1.5" fill="#93C5FD" opacity="0.6" />
      <line x1="12" y1="14" x2="20" y2="14" stroke="#3B82F6" strokeWidth="1" opacity="0.5" />
      <circle cx="16" cy="22" r="1.5" fill="#3B82F6" opacity="0.4" />
    </svg>
  );
}

// 🥣 MPASI/Makan - Bowl with food (orange)
export function MpasiIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M5 16C5 16 7 24 16 24C25 24 27 16 27 16H5Z" fill="#FED7AA" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 24.5V27.5" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 24.5V27.5" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 27H24" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="12" cy="14" rx="2" ry="1.5" fill="#FB923C" opacity="0.7" />
      <ellipse cx="18" cy="13" rx="2.5" ry="2" fill="#FDBA74" opacity="0.6" />
      <path d="M10 10C10 10 11 7 13 8" stroke="#EA580C" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M16 9C16 9 17 6 19 7" stroke="#EA580C" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

// 🍪 Snack - Cookie (amber/gold)
export function SnackIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="11" fill="#FDE68A" stroke="#D97706" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="2" fill="#92400E" opacity="0.7" />
      <circle cx="19" cy="14" r="1.5" fill="#92400E" opacity="0.6" />
      <circle cx="14" cy="20" r="1.8" fill="#92400E" opacity="0.7" />
      <circle cx="21" cy="20" r="1.2" fill="#92400E" opacity="0.5" />
      <circle cx="10" cy="17" r="1" fill="#92400E" opacity="0.4" />
    </svg>
  );
}

// 🍎 Buah - Apple/Fruit (green)
export function BuahIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M16 8C11 8 7 13 7 19C7 25 11 28 16 28C21 28 25 25 25 19C25 13 21 8 16 8Z" fill="#BBF7D0" stroke="#16A34A" strokeWidth="1.5" />
      <path d="M16 8C16 8 16 4 19 3" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M16 8C16 8 14 5 11 5" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12 15C12 15 14 18 16 15" stroke="#16A34A" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
    </svg>
  );
}

// 😴 Tidur - Moon with Z's (indigo)
export function TidurIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M24 16C24 21.52 19.52 26 14 26C8.48 26 4 21.52 4 16C4 10.48 8.48 6 14 6C14.34 6 14.68 6.02 15 6.06C12.84 8.22 11.5 11.18 11.5 14.5C11.5 17.82 12.84 20.78 15 22.94C18.32 22.94 21.28 21.6 23.44 19.44C23.78 18.34 24 17.2 24 16Z" fill="#C7D2FE" stroke="#4F46E5" strokeWidth="1.5" />
      <text x="22" y="12" fontSize="7" fontWeight="bold" fill="#4F46E5" opacity="0.8">Z</text>
      <text x="25" y="8" fontSize="5" fontWeight="bold" fill="#4F46E5" opacity="0.5">Z</text>
    </svg>
  );
}

// ☀️ Bangun - Sun (amber/warm)
export function BangunIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="6" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" />
      <line x1="16" y1="4" x2="16" y2="8" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="16" y1="24" x2="16" y2="28" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="4" y1="16" x2="8" y2="16" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="24" y1="16" x2="28" y2="16" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="7.5" y1="7.5" x2="10.3" y2="10.3" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="21.7" y1="21.7" x2="24.5" y2="24.5" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="7.5" y1="24.5" x2="10.3" y2="21.7" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="21.7" y1="10.3" x2="24.5" y2="7.5" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 💩 BAB/Pup (brown, tasteful)
export function PupIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M8 22C8 18 10 17 12 17C12 17 11 14 14 13C14 13 13 10 16 9C19 8 20 11 19 13C21 13 23 15 22 17C24 17 26 19 24 22C24 25 20 27 16 27C12 27 8 25 8 22Z" fill="#DDD6C8" stroke="#8B7355" strokeWidth="1.5" />
      <circle cx="13" cy="20" r="1" fill="#8B7355" opacity="0.6" />
      <circle cx="19" cy="20" r="1" fill="#8B7355" opacity="0.6" />
      <path d="M14 23Q16 25 18 23" stroke="#8B7355" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.6" />
    </svg>
  );
}

// 💧 Pee - Water Drop (light blue)
export function PeeIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M16 5L10 17C10 17 10 25 16 25C22 25 22 17 22 17L16 5Z" fill="#BFDBFE" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 19C14 19 15 21 18 19" stroke="#3B82F6" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

// 🛁 Mandi - Bathtub (teal)
export function MandiIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M4 16H28" stroke="#0D9488" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 16V22C6 24.76 8.24 27 11 27H21C23.76 27 26 24.76 26 22V16" stroke="#0D9488" strokeWidth="1.8" fill="none" />
      <path d="M8 16V10C8 7.24 10.24 5 13 5H13.5" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <rect x="13" y="4" width="4" height="3" rx="1" fill="#5EEAD4" stroke="#0D9488" strokeWidth="1" />
      <path d="M10 13Q12 11 14 13" stroke="#5EEAD4" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
      <path d="M17 12Q19 10 21 12" stroke="#5EEAD4" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

// 💊 Vitamin - Pill Capsule (rose/pink)
export function VitaminIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <rect x="10" y="7" width="12" height="18" rx="6" fill="#FECDD3" stroke="#E11D48" strokeWidth="1.5" transform="rotate(-30 16 16)" />
      <line x1="11.5" y1="18.5" x2="20.5" y2="13.5" stroke="#E11D48" strokeWidth="1.2" opacity="0.4" />
      <rect x="10" y="7" width="12" height="9" rx="6" fill="#FDA4AF" stroke="#E11D48" strokeWidth="1.5" transform="rotate(-30 16 16)" />
    </svg>
  );
}

// 🧴 Lap Badan - Lotion/Towel (purple)
export function LapBadanIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <rect x="12" y="3" width="8" height="5" rx="1.5" fill="#DDD6FE" stroke="#7C3AED" strokeWidth="1.2" />
      <path d="M13 8L12 12V25C12 26.66 13.34 28 15 28H17C18.66 28 20 26.66 20 25V12L19 8H13Z" fill="#EDE9FE" stroke="#7C3AED" strokeWidth="1.5" />
      <rect x="14" y="15" width="4" height="10" rx="1" fill="#DDD6FE" opacity="0.5" />
      <line x1="14" y1="12" x2="18" y2="12" stroke="#7C3AED" strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

// 📝 Catatan - Notepad (slate)
export function CatatanIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <rect x="7" y="4" width="18" height="24" rx="2" fill="#F1F5F9" stroke="#64748B" strokeWidth="1.5" />
      <line x1="11" y1="11" x2="21" y2="11" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="16" x2="21" y2="16" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="11" y1="21" x2="17" y2="21" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22 4L26 8L22 8V4Z" fill="#CBD5E1" stroke="#64748B" strokeWidth="1" />
    </svg>
  );
}

// 🧠 Insight/Brain (warm purple-pink)
export function InsightIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M16 28V20" stroke="#9333EA" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 18C7 16 6 12 8 9C10 6 14 5 16 5C18 5 22 6 24 9C26 12 25 16 22 18C20.5 19.5 20 20.5 20 22H12C12 20.5 11.5 19.5 10 18Z" fill="#F3E8FF" stroke="#9333EA" strokeWidth="1.5" />
      <line x1="12" y1="22" x2="20" y2="22" stroke="#9333EA" strokeWidth="1.2" />
      <line x1="13" y1="25" x2="19" y2="25" stroke="#9333EA" strokeWidth="1.2" />
      <path d="M16 9V14" stroke="#9333EA" strokeWidth="1" strokeLinecap="round" opacity="0.4" />
      <path d="M13 11L16 14L19 11" stroke="#9333EA" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" fill="none" />
    </svg>
  );
}

// 📈 Chart/Graph (warm teal)
export function ChartIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <line x1="5" y1="26" x2="27" y2="26" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="5" y1="6" x2="5" y2="26" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 20L14 14L18 18L26 8" stroke="#14B8A6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="8" cy="20" r="2" fill="#5EEAD4" stroke="#0D9488" strokeWidth="1" />
      <circle cx="14" cy="14" r="2" fill="#5EEAD4" stroke="#0D9488" strokeWidth="1" />
      <circle cx="18" cy="18" r="2" fill="#5EEAD4" stroke="#0D9488" strokeWidth="1" />
      <circle cx="26" cy="8" r="2" fill="#5EEAD4" stroke="#0D9488" strokeWidth="1" />
    </svg>
  );
}

// 📋 Timeline/Clipboard (warm orange)
export function TimelineIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <rect x="6" y="6" width="20" height="22" rx="2" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.5" />
      <rect x="11" y="3" width="10" height="5" rx="1.5" fill="#FDBA74" stroke="#EA580C" strokeWidth="1.2" />
      <line x1="10" y1="14" x2="22" y2="14" stroke="#FB923C" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="19" x2="22" y2="19" stroke="#FB923C" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="10" y1="24" x2="17" y2="24" stroke="#FB923C" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 🌞 Active/Awake Sun (warm)
export function ActiveSunIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="16" r="7" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.5" />
      <circle cx="13" cy="14.5" r="1" fill="#D97706" />
      <circle cx="19" cy="14.5" r="1" fill="#D97706" />
      <path d="M13 18Q16 21 19 18" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <line x1="16" y1="4" x2="16" y2="7" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="25" x2="16" y2="28" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
      <line x1="5" y1="16" x2="8" y2="16" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="16" x2="27" y2="16" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 😴 Sleeping face (indigo)
export function SleepingIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <circle cx="16" cy="17" r="10" fill="#E0E7FF" stroke="#6366F1" strokeWidth="1.5" />
      <path d="M11 16Q13 14 15 16" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M17 16Q19 14 21 16" stroke="#4F46E5" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <ellipse cx="16" cy="21" rx="2" ry="1.3" fill="#C7D2FE" stroke="#6366F1" strokeWidth="1" />
      <text x="23" y="10" fontSize="7" fontWeight="bold" fill="#6366F1" opacity="0.7" fontFamily="sans-serif">z</text>
      <text x="26" y="6" fontSize="5" fontWeight="bold" fill="#6366F1" opacity="0.4" fontFamily="sans-serif">z</text>
    </svg>
  );
}

// 🍽️ MPASI detail item (plate)
export function PlateIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <ellipse cx="16" cy="20" rx="11" ry="4" fill="#FED7AA" stroke="#EA580C" strokeWidth="1.2" />
      <path d="M5 20C5 15 10 12 16 12C22 12 27 15 27 20" stroke="#EA580C" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

// 🍉 Fruit detail (slice)
export function FruitSliceIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M6 20Q16 4 26 20Z" fill="#BBF7D0" stroke="#16A34A" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="13" cy="16" r="1" fill="#16A34A" opacity="0.5" />
      <circle cx="18" cy="14" r="1" fill="#16A34A" opacity="0.5" />
      <circle cx="16" cy="18" r="1" fill="#16A34A" opacity="0.5" />
    </svg>
  );
}

// 🗑️ Waste/Sisa (amber)
export function WasteIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <path d="M9 10H23L21.5 27H10.5L9 10Z" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.3" />
      <line x1="7" y1="10" x2="25" y2="10" stroke="#D97706" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 7H20V10H12V7Z" fill="#FDE68A" stroke="#D97706" strokeWidth="1" />
      <line x1="14" y1="14" x2="14" y2="24" stroke="#D97706" strokeWidth="1" opacity="0.4" />
      <line x1="18" y1="14" x2="18" y2="24" stroke="#D97706" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

// Map activity type string to icon component
const ACTIVITY_ICON_MAP: Record<string, React.FC<IconProps>> = {
  susu: SusuIcon,
  mpasi: MpasiIcon,
  snack: SnackIcon,
  buah: BuahIcon,
  tidur: TidurIcon,
  bangun: BangunIcon,
  pup: PupIcon,
  pee: PeeIcon,
  mandi: MandiIcon,
  vitamin: VitaminIcon,
  lap_badan: LapBadanIcon,
  catatan: CatatanIcon,
};

// Render activity icon by type key
export function ActivityIcon({ type, size = 20, className = '' }: { type: string; size?: number; className?: string }) {
  const Icon = ACTIVITY_ICON_MAP[type];
  if (!Icon) return <CatatanIcon size={size} className={className} />;
  return <Icon size={size} className={className} />;
}

// Render activity icon from emoji string (for backward compat with ACTIVITY_ICONS)
const EMOJI_TO_TYPE: Record<string, string> = {
  '🍼': 'susu',
  '🥣': 'mpasi',
  '🍪': 'snack',
  '🍎': 'buah',
  '😴': 'tidur',
  '☀️': 'bangun',
  '💩': 'pup',
  '💧': 'pee',
  '🛁': 'mandi',
  '💊': 'vitamin',
  '🧴': 'lap_badan',
  '📝': 'catatan',
  '🤒': 'catatan',
};

export function ActivityIconFromEmoji({ emoji, size = 20, className = '' }: { emoji: string; size?: number; className?: string }) {
  const type = EMOJI_TO_TYPE[emoji];
  if (!type) return <CatatanIcon size={size} className={className} />;
  return <ActivityIcon type={type} size={size} className={className} />;
}
