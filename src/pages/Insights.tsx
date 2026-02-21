import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChildren } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Brain, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';

const Insights = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: children = [] } = useChildren();
  const [selectedChild, setSelectedChild] = useState('');
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);

  const activeChildId = selectedChild || children[0]?.id || '';

  const handleAnalyze = async () => {
    if (!activeChildId) return;
    setLoading(true);
    setInsight('');
    try {
      const { data, error } = await supabase.functions.invoke('child-insights', {
        body: { child_id: activeChildId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setInsight(data.insight);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const backPath = user?.role === 'parent' ? '/parent/dashboard' : '/babysitter/today';

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate(backPath)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Brain className="h-5 w-5" />
          <h1 className="text-lg font-bold">Insight Cerdas</h1>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">
        <Select value={activeChildId} onValueChange={setSelectedChild}>
          <SelectTrigger className="h-11 bg-card"><SelectValue placeholder="Pilih anak" /></SelectTrigger>
          <SelectContent>
            {children.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.avatar_emoji || '👶'} {c.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Button className="w-full h-12 text-base font-bold" onClick={handleAnalyze} disabled={loading || !activeChildId}>
          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menganalisis...</> : '🧠 Analisis Pola Aktivitas'}
        </Button>

        {insight && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 prose prose-sm max-w-none text-sm">
              <ReactMarkdown>{insight}</ReactMarkdown>
            </CardContent>
          </Card>
        )}

        {!insight && !loading && (
          <Card className="border-0 shadow-sm bg-muted/50">
            <CardContent className="p-6 text-center text-muted-foreground text-sm">
              <Brain className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Tekan tombol di atas untuk menganalisis pola aktivitas anak berdasarkan data 14 hari terakhir.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Insights;
