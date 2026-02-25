import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { getChineseZodiac, getWesternZodiac } from '@/lib/zodiac';
import { Sparkles } from 'lucide-react';

interface DailyTriviaProps {
  childName: string;
  dob: string | null;
  date: string; // yyyy-MM-dd
}

const MOODS = ['😊 Ceria', '😴 Tenang', '🤗 Manja', '😆 Aktif', '🥰 Sayang', '😎 PD', '🌈 Happy'];
const LUCK_COLORS = ['Merah 🔴', 'Biru 🔵', 'Kuning 🟡', 'Hijau 🟢', 'Ungu 🟣', 'Pink 🩷', 'Oranye 🟠'];
const TIPS = [
  'Hari yang bagus untuk bermain di luar! 🌤️',
  'Cocok untuk belajar hal baru hari ini 📚',
  'Peluk ekstra hari ini ya! 🤗',
  'Ajak bernyanyi bersama 🎵',
  'Waktu yang tepat untuk eksplorasi 🔍',
  'Bacakan cerita sebelum tidur 📖',
  'Beri pujian ekstra hari ini ⭐',
  'Main air seru hari ini! 💦',
  'Waktunya quality time bersama 💕',
  'Ajak jalan-jalan santai 🚶',
];

function seedFromDate(date: string, offset: number = 0): number {
  const parts = date.split('-');
  const num = parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2]);
  return (num * 31 + offset * 7) % 1000;
}

export function DailyTrivia({ childName, dob, date }: DailyTriviaProps) {
  const trivia = useMemo(() => {
    if (!dob) return null;
    const dobDate = new Date(dob);
    const chinese = getChineseZodiac(dobDate);
    const western = getWesternZodiac(dobDate);

    const s = seedFromDate(date, dobDate.getDate());
    const mood = MOODS[s % MOODS.length];
    const color = LUCK_COLORS[(s + 3) % LUCK_COLORS.length];
    const tip = TIPS[(s + 5) % TIPS.length];
    const energy = ((s % 5) + 6) * 10; // 60-100

    return { chinese, western, mood, color, tip, energy };
  }, [dob, date]);

  if (!trivia) return null;

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-accent/30 to-secondary/30 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold text-foreground">Trivia Harian {childName.split(' ')[0]}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-card/60 rounded-lg p-2.5">
            <p className="text-muted-foreground mb-0.5">Shio</p>
            <p className="font-bold text-sm">{trivia.chinese.emoji} {trivia.chinese.animal}</p>
            <p className="text-muted-foreground">{trivia.chinese.elementEmoji} {trivia.chinese.element}</p>
          </div>
          <div className="bg-card/60 rounded-lg p-2.5">
            <p className="text-muted-foreground mb-0.5">Zodiak</p>
            <p className="font-bold text-sm">{trivia.western.emoji} {trivia.western.sign}</p>
          </div>
          <div className="bg-card/60 rounded-lg p-2.5">
            <p className="text-muted-foreground mb-0.5">Mood Hari Ini</p>
            <p className="font-bold text-sm">{trivia.mood}</p>
          </div>
          <div className="bg-card/60 rounded-lg p-2.5">
            <p className="text-muted-foreground mb-0.5">Warna Keberuntungan</p>
            <p className="font-bold text-sm">{trivia.color}</p>
          </div>
        </div>
        <div className="mt-2.5 bg-card/60 rounded-lg p-2.5">
          <p className="text-xs text-muted-foreground mb-0.5">Energi: {trivia.energy}% ⚡</p>
          <div className="w-full bg-muted rounded-full h-1.5 mb-2">
            <div className="bg-primary rounded-full h-1.5 transition-all" style={{ width: `${trivia.energy}%` }} />
          </div>
          <p className="text-xs font-medium text-foreground">💡 {trivia.tip}</p>
        </div>
      </CardContent>
    </Card>
  );
}
