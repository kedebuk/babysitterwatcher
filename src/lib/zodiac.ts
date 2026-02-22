// Chinese Zodiac (Shio) based on Lunar New Year dates
// Simplified: uses approximate Lunar New Year dates
const CHINESE_ZODIAC_YEARS: { year: number; animal: string; emoji: string; element: string }[] = [];

const animals = ['Tikus', 'Kerbau', 'Macan', 'Kelinci', 'Naga', 'Ular', 'Kuda', 'Kambing', 'Monyet', 'Ayam', 'Anjing', 'Babi'];
const animalEmojis = ['🐀', '🐂', '🐅', '🐇', '🐉', '🐍', '🐴', '🐐', '🐒', '🐓', '🐕', '🐷'];
const elements = ['Kayu', 'Kayu', 'Api', 'Api', 'Tanah', 'Tanah', 'Logam', 'Logam', 'Air', 'Air'];
const elementEmojis: Record<string, string> = { 'Kayu': '🌳', 'Api': '🔥', 'Tanah': '🌍', 'Logam': '⚙️', 'Air': '💧' };

export function getChineseZodiac(dob: Date): { animal: string; emoji: string; element: string; elementEmoji: string } {
  const year = dob.getFullYear();
  // Base: 2024 = Naga (index 4), element cycle starts from Wood (Kayu)
  // 1900 = Tikus, Logam
  const animalIndex = ((year - 1900) % 12 + 12) % 12;
  const elementIndex = ((year - 1900) % 10 + 10) % 10;
  const element = elements[elementIndex];
  return {
    animal: animals[animalIndex],
    emoji: animalEmojis[animalIndex],
    element,
    elementEmoji: elementEmojis[element],
  };
}

export function getWesternZodiac(dob: Date): { sign: string; emoji: string } {
  const month = dob.getMonth() + 1; // 1-12
  const day = dob.getDate();

  const zodiacs: { sign: string; emoji: string; startMonth: number; startDay: number; endMonth: number; endDay: number }[] = [
    { sign: 'Capricorn', emoji: '♑', startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
    { sign: 'Aquarius', emoji: '♒', startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
    { sign: 'Pisces', emoji: '♓', startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
    { sign: 'Aries', emoji: '♈', startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
    { sign: 'Taurus', emoji: '♉', startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
    { sign: 'Gemini', emoji: '♊', startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
    { sign: 'Cancer', emoji: '♋', startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
    { sign: 'Leo', emoji: '♌', startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
    { sign: 'Virgo', emoji: '♍', startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
    { sign: 'Libra', emoji: '♎', startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
    { sign: 'Scorpio', emoji: '♏', startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
    { sign: 'Sagittarius', emoji: '♐', startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
  ];

  for (const z of zodiacs) {
    if (z.startMonth === 12 && z.endMonth === 1) {
      // Capricorn spans year boundary
      if ((month === 12 && day >= z.startDay) || (month === 1 && day <= z.endDay)) return { sign: z.sign, emoji: z.emoji };
    } else {
      if ((month === z.startMonth && day >= z.startDay) || (month === z.endMonth && day <= z.endDay)) return { sign: z.sign, emoji: z.emoji };
    }
  }
  return { sign: 'Unknown', emoji: '⭐' };
}
