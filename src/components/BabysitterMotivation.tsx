import { useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface BabysitterMotivationProps {
  childId: string;
  babysitterName: string;
  date: string;
}

const FALLBACK_QUOTES = [
  'Kak {name}, setiap pelukan dan perhatianmu hari ini membentuk masa depan yang indah. Terus semangat ya! 💛✨',
  'Kak {name}, kesabaranmu dalam merawat anak adalah hadiah terbesar. Kamu luar biasa! 🌟💪',
  'Kak {name}, hari ini adalah kesempatan baru untuk memberikan cinta dan kasih sayang. Semangat! 🌈💕',
  'Kak {name}, setiap momen kecil yang kamu berikan sangat berarti bagi tumbuh kembang si kecil. Terima kasih! 🙏✨',
  'Kak {name}, menjadi pengasuh yang baik butuh hati yang besar — dan kamu punya itu! Semangat terus! 💖🌻',
  'Kak {name}, senyummu hari ini adalah sumber kebahagiaan si kecil. Teruslah menjadi yang terbaik! 😊🌟',
  'Kak {name}, merawat anak adalah pekerjaan mulia. Setiap usahamu tidak pernah sia-sia! 🏆💛',
  'Kak {name}, cinta yang kamu berikan hari ini akan dikenang selamanya. Kamu hebat! ✨🤗',
  'Kak {name}, seperti matahari yang menyinari pagi, kehadiranmu menerangi hari si kecil! ☀️💕',
  'Kak {name}, pengasuh yang penuh kasih adalah pahlawan tanpa tanda jasa. Terima kasih sudah menjadi salah satunya! 🦸‍♀️💖',
];

function getFallbackQuote(name: string, date: string): string {
  const parts = date.split('-');
  const seed = parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2]);
  const idx = seed % FALLBACK_QUOTES.length;
  const firstName = name.split(' ')[0] || 'Kak';
  return FALLBACK_QUOTES[idx].replace('{name}', firstName);
}

export function BabysitterMotivation({ childId, babysitterName, date }: BabysitterMotivationProps) {
  const firstName = babysitterName?.split(' ')[0] || 'Kak';

  const { data: motivation, isLoading, isError } = useQuery({
    queryKey: ['babysitter_motivation', childId, date],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('babysitter-motivation', {
        body: { child_id: childId, date, babysitter_name: babysitterName },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data.motivation as string;
    },
    enabled: !!childId,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 1,
  });

  const fallback = useMemo(() => getFallbackQuote(babysitterName, date), [babysitterName, date]);
  const displayText = motivation || (isError ? fallback : null);

  return (
    <Card className="border-0 shadow-sm bg-gradient-to-r from-amber-50/80 to-rose-50/60 dark:from-amber-950/30 dark:to-rose-950/20">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-bold text-foreground">Kata Penyemangat Hari Ini</span>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Menyiapkan semangat untuk Kak {firstName}... ✨</span>
          </div>
        ) : displayText ? (
          <p className="text-sm leading-relaxed text-foreground animate-fade-in">{displayText}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
