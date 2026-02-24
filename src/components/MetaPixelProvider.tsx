import { useMetaPixel } from '@/hooks/use-meta-pixel';
import { createContext, useContext } from 'react';

interface MetaPixelContextType {
  trackEvent: (eventKey: string, customData?: Record<string, any>) => void;
  settings: Record<string, string>;
}

const MetaPixelContext = createContext<MetaPixelContextType>({
  trackEvent: () => {},
  settings: {},
});

export function MetaPixelProvider({ children }: { children: React.ReactNode }) {
  const pixel = useMetaPixel();
  return (
    <MetaPixelContext.Provider value={pixel}>
      {children}
    </MetaPixelContext.Provider>
  );
}

export function usePixel() {
  return useContext(MetaPixelContext);
}
