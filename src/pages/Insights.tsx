import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChildren } from '@/hooks/use-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Brain, Loader2, Download, Copy, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const Insights = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: children = [] } = useChildren();
  const [selectedChild, setSelectedChild] = useState('');
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);

  const activeChildId = selectedChild || children[0]?.id || '';
  const child = children.find((c: any) => c.id === activeChildId);

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

  const todayStr = format(new Date(), 'EEEE, d MMMM yyyy', { locale: idLocale });
  const childName = child?.name || 'Anak';

  const getPlainText = () => {
    const header = `🧠 Insight Harian ${childName}\n📅 ${todayStr}\n\n`;
    // Strip markdown bold/italic for plain text
    const plain = insight
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/#{1,3}\s/g, '');
    return header + plain;
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(getPlainText());
    toast({ title: '✅ Disalin!', description: 'Insight sudah di-copy ke clipboard' });
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getPlainText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleDownloadNote = () => {
    const blob = new Blob([getPlainText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insight-${childName.replace(/\s+/g, '-').toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: '✅ Terunduh!', description: 'File insight berhasil diunduh' });
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
          <h1 className="text-lg font-bold">Insight Harian</h1>
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
          <>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 prose prose-sm max-w-none text-sm">
                <ReactMarkdown>{insight}</ReactMarkdown>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="h-11 text-xs font-semibold gap-1.5" onClick={handleDownloadNote}>
                <Download className="h-4 w-4" /> Download
              </Button>
              <Button variant="outline" className="h-11 text-xs font-semibold gap-1.5" onClick={handleCopyClipboard}>
                <Copy className="h-4 w-4" /> Salin
              </Button>
              <Button className="h-11 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleShareWhatsApp}>
                <Share2 className="h-4 w-4" /> WhatsApp
              </Button>
            </div>
          </>
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
