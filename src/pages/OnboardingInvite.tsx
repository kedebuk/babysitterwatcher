import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Copy, Check, UserPlus, ArrowRight } from 'lucide-react';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const OnboardingInvite = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const code = generateCode();
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);

      const { error } = await supabase.from('family_invites').insert({
        family_id: user.id,
        invite_code: code,
        invited_by: user.id,
        expires_at: expires.toISOString(),
      } as any);

      if (error) throw error;
      setInviteCode(code);
    } catch (e: any) {
      toast({ title: 'Gagal', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  }, [user, toast]);

  const handleCopy = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast({ title: '✅ Kode disalin!' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDone = () => {
    const role = user?.role;
    const redirectMap: Record<string, string> = {
      parent: '/parent/dashboard',
      babysitter: '/babysitter/today',
      admin: '/admin/dashboard',
    };
    navigate(redirectMap[role || 'parent'] || '/');
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Undang Pengasuh</h1>
          <p className="text-xs text-muted-foreground">Bagikan kode ke babysitter Anda</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 text-center space-y-4">
          {!inviteCode ? (
            <>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                Generate kode undangan untuk mengajak pengasuh bergabung. Kode berlaku selama 7 hari.
              </p>
              <Button onClick={handleGenerate} disabled={generating} className="w-full gap-2">
                {generating ? 'Membuat kode...' : 'Buat Kode Undangan'}
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">Bagikan kode ini ke pengasuh Anda:</p>
              <div className="bg-secondary rounded-xl p-4">
                <p className="text-3xl font-bold font-mono tracking-[0.3em] text-primary">{inviteCode}</p>
              </div>
              <Button variant="outline" onClick={handleCopy} className="w-full gap-2">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Tersalin!' : 'Salin Kode'}
              </Button>
              <p className="text-xs text-muted-foreground">Berlaku hingga 7 hari ke depan</p>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-3">
        <Button variant="outline" onClick={handleDone} className="flex-1">
          {inviteCode ? 'Lanjut ke Dashboard' : 'Lewati'}
        </Button>
        {inviteCode && (
          <Button onClick={handleDone} className="flex-1 gap-2">
            Selesai <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};

export default OnboardingInvite;
