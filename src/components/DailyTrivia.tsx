import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getChineseZodiac, getWesternZodiac } from '@/lib/zodiac';
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DailyTriviaProps {
  childName: string;
  childId: string;
  dob: string | null;
  date: string;
}

const MOODS = ['😊 Ceria', '😴 Tenang', '🤗 Manja', '😆 Aktif', '🥰 Sayang', '😎 PD', '🌈 Happy'];

function seedFromDate(date: string, offset: number = 0): number {
  const parts = date.split('-');
  const num = parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2]);
  return (num * 31 + offset * 7) % 1000;
}

export function DailyTrivia({ childName, childId, dob, date }: DailyTriviaProps) {
  const { toast } = useToast();
  const [horoscope, setHoroscope] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const trivia = useMemo(() => {
    if (!dob) return null;
    const dobDate = new Date(dob);
    const chinese = getChineseZodiac(dobDate);
    const western = getWesternZodiac(dobDate);
    const s = seedFromDate(date, dobDate.getDate());
    const mood = MOODS[s % MOODS.length];
    return { chinese, western, mood };
  }, [dob, date]);

  if (!trivia) return null;

  const handleToggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (horoscope) return;

    setLoading(true);
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
        console.warn('Trivia API error:', data.error);
        setHoroscope('Bintang-bintang sedang istirahat sebentar... coba lagi nanti ya! ✨');
      } else {
        setHoroscope(data.horoscope || 'Bintang-bintang sedang istirahat sebentar... ✨');
      }
    } catch (e: any) {
      console.warn('Trivia error:', e.message);
      setHoroscope('Bintang-bintang sedang istirahat sebentar... coba lagi nanti ya! ✨');
    } finally {
      setLoading(false);
    }
  };

  const firstName = childName.split(' ')[0];

  return (
    <Card
      className="border-0 shadow-sm cursor-pointer transition-all hover:shadow-md bg-gradient-to-r from-violet-50/80 to-amber-50/60 dark:from-violet-950/30 dark:to-amber-950/20"
      onClick={handleToggle}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-foreground">Trivia Harian {firstName}</span>
            <span className="text-xs text-muted-foreground">
              {trivia.western.emoji} {trivia.chinese.emoji}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {!open && <span className="text-[10px] text-primary/60">tap baca</span>}
            {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {open && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Membaca bintang-bintang... ✨</span>
              </div>
            ) : horoscope ? (
              <p className="text-sm leading-relaxed text-foreground">{horoscope}</p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
