import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

// 🍼 Susu - Baby Bottle (sky blue) — bold filled bottle
export function SusuIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect x="15" y="4" width="10" height="5" rx="2" fill="#60A5FA" />
      <path d="M16 9L14 14V32C14 34.2 15.8 36 18 36H22C24.2 36 26 34.2 26 32V14L24 9H16Z" fill="#60A5FA" />
      <rect x="16" y="22" width="8" height="12" rx="2" fill="#93C5FD" />
      <rect x="16" y="14" width="8" height="2" rx="0.5" fill="#93C5FD" />
      <rect x="16" y="18" width="8" height="2" rx="0.5" fill="#93C5FD" />
    </svg>
  );
}

// 🥣 MPASI/Makan - Bowl with steam (warm orange) — filled cute bowl
export function MpasiIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M13 8C13 8 14 5 15.5 7" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M19.5 7C19.5 7 20.5 4 22 6" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M26 8C26 8 27 5 28.5 7" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M6 18H34C34 18 33 30 20 30C7 30 6 18 6 18Z" fill="#F97316" />
      <path d="M14 30L12 35H28L26 30" fill="#FB923C" />
      <ellipse cx="20" cy="18" rx="14" ry="3" fill="#FB923C" />
    </svg>
  );
}

// 🍪 Snack - Cookie (golden amber) — round with chips
export function SnackIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <circle cx="20" cy="20" r="14" fill="#F59E0B" />
      <circle cx="20" cy="20" r="14" fill="url(#snackGrad)" />
      <circle cx="14" cy="14" r="2.5" fill="#92400E" />
      <circle cx="24" cy="16" r="2" fill="#92400E" />
      <circle cx="16" cy="24" r="2.2" fill="#92400E" />
      <circle cx="26" cy="24" r="1.8" fill="#92400E" />
      <circle cx="20" cy="20" r="1.5" fill="#92400E" />
      <defs>
        <radialGradient id="snackGrad" cx="0.35" cy="0.35" r="0.65">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="100%" stopColor="#F59E0B" />
        </radialGradient>
      </defs>
    </svg>
  );
}

// 🍎 Buah - Apple (fresh green) — cute apple with leaf
export function BuahIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M20 12C14 12 9 18 9 25C9 32 14 36 20 36C26 36 31 32 31 25C31 18 26 12 20 12Z" fill="#22C55E" />
      <path d="M20 12C20 12 20 6 24 4" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 7C22 7 26 5 28 7" fill="#4ADE80" stroke="#22C55E" strokeWidth="1.5" />
      <path d="M16 20C16 20 18 24 20 20" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

// 😴 Tidur - Moon with star (soft indigo) — crescent + sparkle
export function TidurIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M28 10C22 10 17 15 17 21C17 27 22 32 28 32C29 32 30 31.8 31 31.5C28.5 29.5 27 26.5 27 23C27 18 30 13.5 34 12C32.5 10.7 30.4 10 28 10Z" fill="#818CF8" />
      <circle cx="14" cy="12" r="2" fill="#A5B4FC" />
      <path d="M14 8V16M10 12H18" stroke="#C7D2FE" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="26" r="1.5" fill="#C7D2FE" />
      <circle cx="24" cy="8" r="1" fill="#C7D2FE" />
    </svg>
  );
}

// ☀️ Bangun - Sun with rays (warm yellow) — cute sun face
export function BangunIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <circle cx="20" cy="20" r="9" fill="#FBBF24" />
      <line x1="20" y1="4" x2="20" y2="9" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <line x1="20" y1="31" x2="20" y2="36" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <line x1="4" y1="20" x2="9" y2="20" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <line x1="31" y1="20" x2="36" y2="20" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <line x1="8.7" y1="8.7" x2="12.2" y2="12.2" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <line x1="27.8" y1="27.8" x2="31.3" y2="31.3" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <line x1="8.7" y1="31.3" x2="12.2" y2="27.8" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <line x1="27.8" y1="12.2" x2="31.3" y2="8.7" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16.5" cy="18" r="1.5" fill="#92400E" />
      <circle cx="23.5" cy="18" r="1.5" fill="#92400E" />
      <path d="M16 23Q20 27 24 23" stroke="#92400E" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 💩 BAB/Pup (warm brown) — cute friendly swirl
export function PupIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M11 28C11 24 13 23 15 23C15 23 14 20 17 19C17 19 16 16 19 15C22.5 14 24 17 22.5 19C25 19 27 21 26 23C28 23 30 25 28 28C28 32 24 34 20 34C16 34 11 32 11 28Z" fill="#D2956A" />
      <circle cx="17" cy="26" r="1.5" fill="#8B5E3C" />
      <circle cx="23" cy="26" r="1.5" fill="#8B5E3C" />
      <path d="M18 30Q20 32 22 30" stroke="#8B5E3C" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <ellipse cx="15" cy="27" rx="2.5" ry="1.5" fill="#E8B08A" opacity="0.5" />
      <ellipse cx="25" cy="27" rx="2.5" ry="1.5" fill="#E8B08A" opacity="0.5" />
    </svg>
  );
}

// 💧 Pee - Water Drop (ocean blue) — bold droplet
export function PeeIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M20 6L12 22C12 22 12 34 20 34C28 34 28 22 28 22L20 6Z" fill="#38BDF8" />
      <path d="M16 24C16 24 18 28 24 24" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <ellipse cx="17" cy="20" rx="2" ry="3" fill="white" opacity="0.3" transform="rotate(-15 17 20)" />
    </svg>
  );
}

// 🛁 Mandi - Bathtub with bubbles (teal) — cute tub
export function MandiIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect x="4" y="17" width="32" height="4" rx="2" fill="#14B8A6" />
      <path d="M7 21V30C7 33 10 36 14 36H26C30 36 33 33 33 30V21" fill="#14B8A6" />
      <path d="M10 21V12C10 8.7 12.7 6 16 6" stroke="#14B8A6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16" cy="6" r="2.5" fill="#5EEAD4" />
      <circle cx="14" cy="12" r="2.5" fill="#5EEAD4" stroke="#14B8A6" strokeWidth="1" />
      <circle cx="20" cy="11" r="2" fill="#5EEAD4" stroke="#14B8A6" strokeWidth="1" />
      <circle cx="26" cy="13" r="1.5" fill="#5EEAD4" stroke="#14B8A6" strokeWidth="1" />
      <rect x="12" y="26" width="16" height="2" rx="1" fill="#5EEAD4" opacity="0.5" />
    </svg>
  );
}

// 💊 Vitamin - Pill Capsule (rose pink) — cute two-tone pill
export function VitaminIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <g transform="rotate(-35 20 20)">
        <rect x="13" y="8" width="14" height="24" rx="7" fill="#FB7185" />
        <rect x="13" y="20" width="14" height="12" rx="7" fill="#FECDD3" />
        <ellipse cx="18" cy="14" rx="2" ry="3" fill="white" opacity="0.3" />
      </g>
    </svg>
  );
}

// 🧴 Lap Badan - Towel/Lotion (purple) — cute bottle
export function LapBadanIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect x="15" y="4" width="10" height="6" rx="2" fill="#A78BFA" />
      <rect x="18" y="2" width="4" height="4" rx="1" fill="#C4B5FD" />
      <path d="M14 10H26L27 14V32C27 34.2 25.2 36 23 36H17C14.8 36 13 34.2 13 32V14L14 10Z" fill="#8B5CF6" />
      <rect x="16" y="18" width="8" height="14" rx="2" fill="#A78BFA" opacity="0.5" />
      <rect x="16" y="14" width="8" height="2" rx="0.5" fill="#C4B5FD" />
      <circle cx="20" cy="25" r="3" fill="#C4B5FD" opacity="0.6" />
    </svg>
  );
}

// 📝 Catatan - Notepad (slate blue) — cute note with pencil
export function CatatanIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect x="8" y="5" width="20" height="30" rx="3" fill="#64748B" />
      <rect x="10" y="7" width="16" height="26" rx="2" fill="#F1F5F9" />
      <line x1="14" y1="14" x2="24" y2="14" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="19" x2="24" y2="19" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="24" x2="20" y2="24" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 26L34 20L36 22L30 28L27 29L28 26Z" fill="#F59E0B" />
      <path d="M34 20L36 22" stroke="#D97706" strokeWidth="1.5" />
    </svg>
  );
}

// 🧠 Insight/Brain (vibrant purple) — lightbulb idea
export function InsightIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M20 4C13 4 8 9.5 8 16C8 20.5 10.5 24 14 26V30C14 31.1 14.9 32 16 32H24C25.1 32 26 31.1 26 30V26C29.5 24 32 20.5 32 16C32 9.5 27 4 20 4Z" fill="#A855F7" />
      <rect x="15" y="32" width="10" height="2" rx="1" fill="#7C3AED" />
      <rect x="16" y="35" width="8" height="2" rx="1" fill="#7C3AED" />
      <path d="M20 12V20" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 16L20 20L24 16" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <ellipse cx="15" cy="14" rx="2" ry="3" fill="white" opacity="0.2" />
    </svg>
  );
}

// 📈 Chart/Graph (vivid teal) — bold bar chart
export function ChartIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect x="6" y="24" width="7" height="12" rx="2" fill="#2DD4BF" />
      <rect x="16.5" y="14" width="7" height="22" rx="2" fill="#14B8A6" />
      <rect x="27" y="8" width="7" height="28" rx="2" fill="#0D9488" />
      <path d="M8 20L20 10L30 5" stroke="#5EEAD4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="8" cy="20" r="2.5" fill="#5EEAD4" />
      <circle cx="20" cy="10" r="2.5" fill="#5EEAD4" />
      <circle cx="30" cy="5" r="2.5" fill="#5EEAD4" />
    </svg>
  );
}

// 📋 Timeline/Clipboard (warm coral) — bold clipboard
export function TimelineIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <rect x="7" y="7" width="26" height="30" rx="3" fill="#F97316" />
      <rect x="14" y="3" width="12" height="7" rx="2.5" fill="#FB923C" stroke="#EA580C" strokeWidth="1.5" />
      <line x1="13" y1="17" x2="27" y2="17" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="13" y1="23" x2="27" y2="23" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="13" y1="29" x2="21" y2="29" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// 🌞 Active/Awake Sun — cute smiling sun
export function ActiveSunIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <circle cx="20" cy="20" r="10" fill="#FBBF24" />
      <line x1="20" y1="3" x2="20" y2="8" stroke="#FCD34D" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="20" y1="32" x2="20" y2="37" stroke="#FCD34D" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="3" y1="20" x2="8" y2="20" stroke="#FCD34D" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="32" y1="20" x2="37" y2="20" stroke="#FCD34D" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="8" y1="8" x2="11.5" y2="11.5" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
      <line x1="28.5" y1="28.5" x2="32" y2="32" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
      <line x1="8" y1="32" x2="11.5" y2="28.5" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
      <line x1="28.5" y1="11.5" x2="32" y2="8" stroke="#FCD34D" strokeWidth="3" strokeLinecap="round" />
      <circle cx="16.5" cy="18" r="1.8" fill="#92400E" />
      <circle cx="23.5" cy="18" r="1.8" fill="#92400E" />
      <path d="M15.5 23Q20 27.5 24.5 23" stroke="#92400E" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// 😴 Sleeping face — cute sleeping moon face
export function SleepingIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <circle cx="18" cy="22" r="13" fill="#818CF8" />
      <path d="M12 20Q15 18 18 20" stroke="#312E81" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M18 20Q21 18 24 20" stroke="#312E81" strokeWidth="2" strokeLinecap="round" fill="none" />
      <ellipse cx="18" cy="26" rx="3" ry="2" fill="#6366F1" />
      <ellipse cx="12" cy="23" rx="3" ry="2" fill="#A5B4FC" opacity="0.4" />
      <ellipse cx="24" cy="23" rx="3" ry="2" fill="#A5B4FC" opacity="0.4" />
      <text x="30" y="12" fontSize="10" fontWeight="900" fill="#818CF8" fontFamily="sans-serif">z</text>
      <text x="34" y="6" fontSize="7" fontWeight="900" fill="#A5B4FC" fontFamily="sans-serif">z</text>
    </svg>
  );
}

// 🍽️ MPASI detail item (small plate)
export function PlateIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <ellipse cx="20" cy="24" rx="14" ry="5" fill="#FB923C" />
      <path d="M6 24C6 17 12 12 20 12C28 12 34 17 34 24" fill="#FDBA74" />
      <ellipse cx="20" cy="24" rx="14" ry="3" fill="#F97316" opacity="0.3" />
    </svg>
  );
}

// 🍉 Fruit detail (slice)
export function FruitSliceIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M6 26Q20 2 34 26Z" fill="#4ADE80" strokeLinejoin="round" />
      <path d="M8 26Q20 6 32 26" fill="#86EFAC" />
      <circle cx="16" cy="20" r="1.5" fill="#166534" />
      <circle cx="22" cy="17" r="1.5" fill="#166534" />
      <circle cx="20" cy="23" r="1.5" fill="#166534" />
    </svg>
  );
}

// 🗑️ Waste/Sisa (amber warning)
export function WasteIcon({ size = 20, className = '' }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" className={className}>
      <path d="M11 14H29L27 34H13L11 14Z" fill="#F59E0B" />
      <rect x="8" y="11" width="24" height="3" rx="1.5" fill="#D97706" />
      <rect x="15" y="8" width="10" height="4" rx="1.5" fill="#FBBF24" />
      <line x1="17" y1="19" x2="17" y2="30" stroke="white" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
      <line x1="23" y1="19" x2="23" y2="30" stroke="white" strokeWidth="1.5" opacity="0.4" strokeLinecap="round" />
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
