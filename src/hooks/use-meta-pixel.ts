import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

let pixelInitialized = false;

function initPixel(pixelId: string) {
  if (pixelInitialized || !pixelId) return;
  
  // Meta Pixel base code
  const f = window;
  const b = document;
  if (f.fbq) return;
  const n: any = f.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  };
  if (!f._fbq) f._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = '2.0';
  n.queue = [];
  const t = b.createElement('script');
  t.async = true;
  t.src = 'https://connect.facebook.net/en_US/fbevents.js';
  const s = b.getElementsByTagName('script')[0];
  s.parentNode?.insertBefore(t, s);
  
  window.fbq('init', pixelId);
  window.fbq('track', 'PageView');
  pixelInitialized = true;
}

export function useMetaPixel() {
  const [settings, setSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('app_settings' as any)
        .select('key, value')
        .in('key', ['meta_pixel_id', 'pixel_event_signup', 'pixel_event_whatsapp']);
      
      if (data) {
        const map: Record<string, string> = {};
        (data as any[]).forEach((row: any) => { map[row.key] = row.value; });
        setSettings(map);
        
        if (map.meta_pixel_id) {
          initPixel(map.meta_pixel_id);
        }
      }
    };
    load();
  }, []);

  const trackEvent = useCallback((eventKey: string, customData?: Record<string, any>) => {
    const eventName = settings[eventKey];
    if (!eventName || !settings.meta_pixel_id || !window.fbq) return;
    window.fbq('track', eventName, customData);
  }, [settings]);

  return { trackEvent, settings };
}
