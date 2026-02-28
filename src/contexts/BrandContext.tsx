import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BrandContextType {
  brandName: string;
  brandLogoUrl: string;
  faviconUrl: string;
  loading: boolean;
  refresh: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType>({
  brandName: 'Eleanor Tracker',
  brandLogoUrl: '',
  faviconUrl: '',
  loading: true,
  refresh: async () => {},
});

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brandName, setBrandName] = useState('Eleanor Tracker');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBrand = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['brand_name', 'brand_logo_url', 'brand_favicon_url']);

    if (data) {
      (data as any[]).forEach((row: any) => {
        if (row.key === 'brand_name' && row.value) setBrandName(row.value);
        if (row.key === 'brand_logo_url' && row.value) setBrandLogoUrl(row.value);
        if (row.key === 'brand_favicon_url' && row.value) setFaviconUrl(row.value);
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadBrand();
  }, []);

  // Update document title
  useEffect(() => {
    document.title = `${brandName} — Pantau Si Kecil dengan Cinta`;
  }, [brandName]);

  // Update favicon dynamically
  useEffect(() => {
    if (!faviconUrl) return;
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    const separator = faviconUrl.includes('?') ? '&' : '?';
    link.href = `${faviconUrl}${separator}v=2`;
  }, [faviconUrl]);

  return (
    <BrandContext.Provider value={{ brandName, brandLogoUrl, faviconUrl, loading, refresh: loadBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
