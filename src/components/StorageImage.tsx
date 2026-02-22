import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SIGNED_URL_EXPIRY = 3600; // 1 hour

// Cache signed URLs to avoid regenerating on every render
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

function parseStorageUrl(url: string): { bucket: string; path: string } | null {
  if (!url || !SUPABASE_URL) return null;
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/`;
  if (!url.startsWith(prefix)) return null;
  const rest = url.slice(prefix.length);
  const slashIndex = rest.indexOf('/');
  if (slashIndex === -1) return null;
  return { bucket: rest.slice(0, slashIndex), path: rest.slice(slashIndex + 1) };
}

export function useSignedUrl(publicUrl: string | null | undefined): string | null {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!publicUrl) { setSignedUrl(null); return; }

    const parsed = parseStorageUrl(publicUrl);
    if (!parsed) { setSignedUrl(publicUrl); return; } // Not a storage URL, use as-is

    const cacheKey = `${parsed.bucket}/${parsed.path}`;
    const cached = signedUrlCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      setSignedUrl(cached.url);
      return;
    }

    let cancelled = false;
    supabase.storage
      .from(parsed.bucket)
      .createSignedUrl(parsed.path, SIGNED_URL_EXPIRY)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data?.signedUrl) {
          setSignedUrl(publicUrl); // Fallback
          return;
        }
        signedUrlCache.set(cacheKey, {
          url: data.signedUrl,
          expiresAt: Date.now() + (SIGNED_URL_EXPIRY - 60) * 1000,
        });
        setSignedUrl(data.signedUrl);
      });

    return () => { cancelled = true; };
  }, [publicUrl]);

  return signedUrl;
}

interface StorageImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string | null | undefined;
}

export function StorageImage({ src, ...props }: StorageImageProps) {
  const signedUrl = useSignedUrl(src);
  if (!signedUrl) return null;
  return <img {...props} src={signedUrl} />;
}
