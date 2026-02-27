import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Camera, Loader2, Check, HelpCircle } from 'lucide-react';

interface FoodScanResult {
  foods: { name: string; estimated_gram: number }[];
  total_gram: number | null;
  description: string;
  confidence: string;
  question: string | null;
}

interface FoodScanButtonProps {
  parentId: string;
  onResult: (detail: string, amount: string, unit: string) => void;
  disabled?: boolean;
}

export function FoodScanButton({ parentId, onResult, disabled }: FoodScanButtonProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<FoodScanResult | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    setScanning(true);
    setShowDialog(true);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke('recognize-food', {
        body: { image_base64: base64, parent_id: parentId },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setResult(data);
    } catch (err: any) {
      toast({ title: '❌ Gagal scan', description: err.message, variant: 'destructive' });
      setShowDialog(false);
    } finally {
      setScanning(false);
    }
  };

  const handleAccept = () => {
    if (!result) return;
    onResult(
      result.description || result.foods?.map(f => f.name).join(' + ') || '',
      result.total_gram?.toString() || '',
      'gram'
    );
    toast({ title: '✅ Makanan dikenali!', description: result.description });
    setShowDialog(false);
    setResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleClose = () => {
    setShowDialog(false);
    setResult(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 text-xs border-primary/30 text-primary hover:bg-primary/10"
        onClick={() => fileRef.current?.click()}
        disabled={disabled || scanning}
      >
        {scanning ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Camera className="mr-1 h-3.5 w-3.5" />}
        🤖 Scan Makanan
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => {
          if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
          e.target.value = '';
        }}
      />

      <Dialog open={showDialog} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">🤖 Hasil Scan Makanan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {previewUrl && (
              <img src={previewUrl} alt="Food" className="rounded-lg w-full h-40 object-cover" />
            )}

            {scanning ? (
              <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Menganalisis foto...</span>
              </div>
            ) : result ? (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-medium">📝 {result.description}</p>
                  {result.foods?.map((f, i) => (
                    <div key={i} className="flex justify-between text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                      <span>🍽️ {f.name}</span>
                      <span className="font-medium">~{f.estimated_gram}g</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold border-t pt-1">
                    <span>Total</span>
                    <span>{result.total_gram}g</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {result.confidence === 'high' ? (
                      <span className="text-green-600">✅ Yakin</span>
                    ) : result.confidence === 'medium' ? (
                      <span className="text-yellow-600">⚠️ Cukup yakin</span>
                    ) : (
                      <span className="text-red-600">❓ Kurang yakin</span>
                    )}
                  </div>
                  {result.question && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2 text-xs flex gap-1.5">
                      <HelpCircle className="h-3.5 w-3.5 text-yellow-600 shrink-0 mt-0.5" />
                      <span>{result.question}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 h-9 text-xs" onClick={handleClose}>
                    Batal
                  </Button>
                  <Button className="flex-1 h-9 text-xs" onClick={handleAccept}>
                    <Check className="mr-1 h-3.5 w-3.5" /> Gunakan Hasil
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
