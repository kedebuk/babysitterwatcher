import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Baby } from 'lucide-react';

const OnboardingChildren = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const numChildren = (location.state as any)?.numChildren || 1;
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [childrenData, setChildrenData] = useState<Array<{
    name: string;
    dob: string;
    gender: 'male' | 'female';
    medical_notes: string;
    routine_notes: string;
  }>>(
    Array.from({ length: numChildren }, () => ({
      name: '', dob: '', gender: 'male' as const, medical_notes: '', routine_notes: '',
    }))
  );

  const updateChild = (field: string, value: string) => {
    setChildrenData(prev => {
      const next = [...prev];
      next[currentStep] = { ...next[currentStep], [field]: value };
      return next;
    });
  };

  const current = childrenData[currentStep];
  const isValid = current.name.trim() !== '' && current.dob !== '';

  const handleNext = async () => {
    if (!user) return;

    if (currentStep < numChildren - 1) {
      setCurrentStep(prev => prev + 1);
      return;
    }

    // Save all children
    setSaving(true);
    try {
      // Check if subscription exists, if not create a trial
      let { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!sub) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 14);
        const { data: newSub } = await supabase.from('subscriptions').insert({
          user_id: user.id,
          plan_type: 'trial' as any,
          status: 'trial' as any,
          number_of_children: numChildren,
          trial_start_date: new Date().toISOString(),
          trial_end_date: trialEnd.toISOString(),
          subscription_start_date: new Date().toISOString(),
          price_per_month: 0,
        }).select('id').single();
        sub = newSub;
      }

      for (const child of childrenData) {
        // Insert into children_profiles
        await supabase.from('children_profiles').insert({
          user_id: user.id,
          subscription_id: sub?.id || null,
          name: child.name,
          date_of_birth: child.dob,
          gender: child.gender,
          medical_notes: child.medical_notes || null,
          routine_notes: child.routine_notes || null,
        } as any);

        // Also insert into existing children table for compatibility
        await supabase.from('children').insert({
          parent_id: user.id,
          name: child.name,
          dob: child.dob,
          notes: [child.medical_notes, child.routine_notes].filter(Boolean).join(' | ') || null,
        });
      }

      // Invalidate subscription cache so SubscriptionGuard sees the new trial
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      // Small delay to ensure cache is updated before navigating
      await new Promise(resolve => setTimeout(resolve, 300));
      navigate('/parent/dashboard', { replace: true });
    } catch (e: any) {
      toast({ title: 'Gagal menyimpan', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 max-w-lg mx-auto">
      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
          <Baby className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Profil Anak {currentStep + 1} dari {numChildren}</h1>
          <p className="text-xs text-muted-foreground">Isi data anak Anda</p>
        </div>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6">
        {Array.from({ length: numChildren }, (_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i <= currentStep ? 'bg-primary' : 'bg-secondary'
            }`}
          />
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Anak *</Label>
            <Input
              id="name"
              placeholder="Masukkan nama anak"
              value={current.name}
              onChange={e => updateChild('name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dob">Tanggal Lahir *</Label>
            <Input
              id="dob"
              type="date"
              value={current.dob}
              onChange={e => updateChild('dob', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Jenis Kelamin</Label>
            <Select value={current.gender} onValueChange={v => updateChild('gender', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">👦 Laki-laki</SelectItem>
                <SelectItem value="female">👧 Perempuan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical">Catatan Medis / Alergi</Label>
            <Textarea
              id="medical"
              placeholder="Contoh: alergi susu sapi, asma..."
              value={current.medical_notes}
              onChange={e => updateChild('medical_notes', e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="routine">Catatan Rutinitas Harian</Label>
            <Textarea
              id="routine"
              placeholder="Contoh: tidur siang jam 1, makan jam 12..."
              value={current.routine_notes}
              onChange={e => updateChild('routine_notes', e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 flex gap-3">
        {currentStep > 0 && (
          <Button variant="outline" onClick={() => setCurrentStep(prev => prev - 1)} className="flex-1">
            Kembali
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!isValid || saving}
          className="flex-1 gap-2"
        >
          {saving ? 'Menyimpan...' : currentStep < numChildren - 1 ? 'Lanjut' : 'Selesai'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default OnboardingChildren;
