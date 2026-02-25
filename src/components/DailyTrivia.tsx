import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getChineseZodiac, getWesternZodiac } from '@/lib/zodiac';
import { Sparkles, BookOpen, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DailyTriviaProps {
  childName: string;
  childId: string;
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

export function DailyTrivia({ childName, childId, dob, date }: DailyTriviaProps) {
  const { toast } = useToast();
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHoroscope, setShowHoroscope] = useState(false);

  const trivia = useMemo(() => {
    if (!dob) return null;
    const dobDate = new Date(dob);
    const chinese = getChineseZodiac(dobDate);
    const western = getWesternZodiac(dobDate);

    const s = seedFromDate(date, dobDate.getDate());
    const mood = MOODS[s % MOODS.length];
    const color = LUCK_COLORS[(s + 3) % LUCK_COLORS.length];
    const tip = TIPS[(s + 5) % TIPS.length];
    const energy = ((s % 5) + 6) * 10;

    return { chinese, western, mood, color, tip, energy };
  }, [dob, date]);

  if (!trivia) return null;

  const fetchHoroscope = async () => {
    if (horoscope) {
      setShowHoroscope(true);
      return;
    }
    setLoading(true);
    setShowHoroscope(true);
    try {
      const { data, error } = await supabase.functions.invoke('daily-horoscope', {
        body: {
          child_id: childId,
          date,
          zodiac_sign: trivia.western.sign,
          shio: trivia.chinese.animal,
          element: trivia.chinese.element,
          mood: trivia.mood,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: 'Oops', description: data.error, variant: 'destructive' });
        setShowHoroscope(false);
      } else {
        setHoroscope(data.horoscope);
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Gagal memuat ramalan', variant: 'destructive' });
      setShowHoroscope(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-br from-accent/30 to-secondary/30 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Trivia Harian {childName.split(' ')[0]}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2.5 text-xs font-semibold text-primary hover:bg-primary/10 gap-1"
            onClick={fetchHoroscope}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <BookOpen className="h-3 w-3" />}
            Ramalan ✨
          </Button>
        </div>

        {showHoroscope && (
          <div className="mb-3 bg-card/80 rounded-xl p-3 relative animate-in fade-in slide-in-from-top-2 duration-300">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setShowHoroscope(false)}
            >
              <X className="h-3 w-3" />
            </Button>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Membaca bintang-bintang...</span>
              </div>
            ) : (
              <p className="text-sm leading-relaxed text-foreground pr-5">{horoscope}</p>
            )}
          </div>
        )}

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
