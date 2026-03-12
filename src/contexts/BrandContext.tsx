import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BrandContextType {
  brandName: string;
  brandLogoUrl: string;
  faviconUrl: string;
  loading: boolean;
  refresh: () => Promise<void>;
}

const BRAND_NAME = 'Ellie - Caretaker Log';

const BrandContext = createContext<BrandContextType>({
  brandName: BRAND_NAME,
  brandLogoUrl: '',
  faviconUrl: '',
  loading: true,
  refresh: async () => {},
});

export function BrandProvider({ children }: { children: React.ReactNode }) {
  const [brandName] = useState(BRAND_NAME);
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [loading, setLoading] = useState(true);

  const loadBrand = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('key, value')
      .in('key', ['brand_logo_url', 'brand_favicon_url']);

    if (data) {
      (data as any[]).forEach((row: any) => {
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
    document.title = brandName;
  }, [brandName]);

  // Favicon is now set via /favicon.svg in index.html — no dynamic override needed

  return (
    <BrandContext.Provider value={{ brandName, brandLogoUrl, faviconUrl, loading, refresh: loadBrand }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  return useContext(BrandContext);
}
