interface IconProps {
  className?: string;
  size?: number;
}

export function BabyIcon({ className = '', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="20" r="12" fill="#FBBF24" opacity="0.2" />
      <circle cx="24" cy="20" r="10" stroke="#F59E0B" strokeWidth="2.5" fill="none" />
      <circle cx="20" cy="18" r="1.5" fill="#92400E" />
      <circle cx="28" cy="18" r="1.5" fill="#92400E" />
      <path d="M21 23 Q24 26 27 23" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M14 14 Q16 6 24 6 Q32 6 34 14" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="24" cy="7" r="2" fill="#FBBF24" />
      <path d="M18 32 Q24 38 30 32" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function ChildIcon({ className = '', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="20" r="12" fill="#FB923C" opacity="0.2" />
      <circle cx="24" cy="20" r="10" stroke="#EA580C" strokeWidth="2.5" fill="none" />
      <circle cx="20" cy="18" r="1.5" fill="#7C2D12" />
      <circle cx="28" cy="18" r="1.5" fill="#7C2D12" />
      <path d="M21 23 Q24 26 27 23" stroke="#7C2D12" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M15 15 Q15 8 24 8 Q33 8 33 15" stroke="#EA580C" strokeWidth="2.5" fill="none" />
      <path d="M15 15 L13 12" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
      <path d="M33 15 L35 12" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 32 Q24 38 30 32" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function GirlIcon({ className = '', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="20" r="12" fill="#FDA4AF" opacity="0.25" />
      <circle cx="24" cy="20" r="10" stroke="#E11D48" strokeWidth="2.5" fill="none" />
      <circle cx="20" cy="18" r="1.5" fill="#881337" />
      <circle cx="28" cy="18" r="1.5" fill="#881337" />
      <path d="M21 23 Q24 26 27 23" stroke="#881337" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M14 16 Q14 6 24 6 Q34 6 34 16" stroke="#E11D48" strokeWidth="2.5" fill="none" />
      <path d="M14 16 Q12 20 11 24" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 16 Q36 20 37 24" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="7" r="2" fill="#FB7185" />
      <path d="M18 32 Q24 38 30 32" stroke="#E11D48" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BoyIcon({ className = '', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <circle cx="24" cy="20" r="12" fill="#93C5FD" opacity="0.25" />
      <circle cx="24" cy="20" r="10" stroke="#2563EB" strokeWidth="2.5" fill="none" />
      <circle cx="20" cy="18" r="1.5" fill="#1E3A5F" />
      <circle cx="28" cy="18" r="1.5" fill="#1E3A5F" />
      <path d="M21 23 Q24 26 27 23" stroke="#1E3A5F" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M14 15 Q16 7 24 7 Q32 7 34 15" stroke="#2563EB" strokeWidth="2.5" fill="none" />
      <path d="M14 15 L12 13 L18 12" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M18 32 Q24 38 30 32" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function BottleIcon({ className = '', size = 28 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="18" y="4" width="12" height="6" rx="2" stroke="#8B5CF6" strokeWidth="2" fill="none" />
      <path d="M19 10 L17 16 L17 40 Q17 44 21 44 L27 44 Q31 44 31 40 L31 16 L29 10" stroke="#8B5CF6" strokeWidth="2.5" fill="none" />
      <rect x="19" y="26" width="10" height="16" rx="2" fill="#C4B5FD" opacity="0.4" />
      <line x1="19" y1="20" x2="29" y2="20" stroke="#8B5CF6" strokeWidth="1.5" />
      <line x1="19" y1="26" x2="29" y2="26" stroke="#8B5CF6" strokeWidth="1.5" />
    </svg>
  );
}

// Map emoji keys to SVG components
const AVATAR_MAP: Record<string, React.FC<IconProps>> = {
  '👶': BabyIcon,
  '🧒': ChildIcon,
  '👧': GirlIcon,
  '👦': BoyIcon,
  '🍼': BottleIcon,
};

export const AVATAR_KEYS = ['👶', '🧒', '👧', '👦', '🍼'] as const;

export const AVATAR_LABELS: Record<string, string> = {
  '👶': 'Bayi',
  '🧒': 'Anak',
  '👧': 'Perempuan',
  '👦': 'Laki-laki',
  '🍼': 'Botol',
};

export function AvatarSvg({ emoji, size = 28, className = '' }: { emoji: string; size?: number; className?: string }) {
  const Icon = AVATAR_MAP[emoji];
  if (!Icon) {
    return <span className={className} style={{ fontSize: size * 0.8 }}>{emoji}</span>;
  }
  return <Icon size={size} className={className} />;
}
