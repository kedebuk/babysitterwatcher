// Smart icon mapping for "catatan" type based on detail keywords
const CATATAN_ICON_RULES: { keywords: string[]; icon: string }[] = [
  { keywords: ['air putih', 'minum air', 'water'], icon: '💧' },
  { keywords: ['tummy time', 'tammy time', 'telentang', 'tengkurap'], icon: '🤒' },
  { keywords: ['jalan', 'berjalan', 'walking', 'merangkak', 'crawl'], icon: '🚶' },
  { keywords: ['bermain', 'main', 'play', 'mainan'], icon: '🧸' },
  { keywords: ['menangis', 'nangis', 'rewel', 'cranky', 'fussy'], icon: '😢' },
  { keywords: ['tertawa', 'ketawa', 'senyum', 'happy', 'senang'], icon: '😊' },
  { keywords: ['gumoh', 'muntah', 'vomit', 'spit up'], icon: '🤮' },
  { keywords: ['demam', 'panas', 'fever', 'sakit', 'sick'], icon: '🤒' },
  { keywords: ['batuk', 'cough', 'pilek', 'flu'], icon: '🤧' },
  { keywords: ['gigi', 'tooth', 'teething', 'tumbuh gigi'], icon: '🦷' },
  { keywords: ['baca', 'buku', 'book', 'read', 'cerita', 'story'], icon: '📖' },
  { keywords: ['musik', 'music', 'nyanyi', 'sing', 'lagu'], icon: '🎵' },
  { keywords: ['jemur', 'sinar matahari', 'sunbath', 'sun'], icon: '☀️' },
  { keywords: ['pijat', 'massage', 'pijet'], icon: '💆' },
  { keywords: ['popok', 'diaper', 'ganti popok'], icon: '👶' },
  { keywords: ['susu', 'asi', 'breast', 'nursing', 'menyusui'], icon: '🤱' },
  { keywords: ['tidur siang', 'nap'], icon: '💤' },
  { keywords: ['vaksin', 'imunisasi', 'suntik', 'vaccine'], icon: '💉' },
  { keywords: ['timbang', 'berat', 'weight'], icon: '⚖️' },
  { keywords: ['ukur', 'tinggi', 'height', 'panjang'], icon: '📏' },
];

/**
 * Returns a contextual emoji icon based on the event type and detail text.
 * For "catatan" type, analyzes the detail to pick a relevant icon.
 * For other types, returns the standard activity icon.
 */
export function getSmartIcon(type: string, detail?: string | null, fallbackIcon?: string): string {
  if (type !== 'catatan' || !detail) {
    return fallbackIcon || '📝';
  }

  const lowerDetail = detail.toLowerCase();
  for (const rule of CATATAN_ICON_RULES) {
    if (rule.keywords.some(kw => lowerDetail.includes(kw))) {
      return rule.icon;
    }
  }

  return fallbackIcon || '📝';
}
