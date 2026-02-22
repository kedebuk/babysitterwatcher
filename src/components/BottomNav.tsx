import { useLocation, useNavigate } from 'react-router-dom';
import { Home, PenLine, MessageCircle, User, History } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const PARENT_ITEMS: NavItem[] = [
  { icon: Home, label: 'Dashboard', path: '/parent/dashboard' },
  { icon: PenLine, label: 'Input', path: '/parent/input' },
  { icon: MessageCircle, label: 'Chat', path: '/chat' },
  { icon: User, label: 'Profil', path: '/profile' },
];

const BABYSITTER_ITEMS: NavItem[] = [
  { icon: PenLine, label: 'Input', path: '/babysitter/today' },
  { icon: History, label: 'Riwayat', path: '/babysitter/history' },
  { icon: MessageCircle, label: 'Chat', path: '/chat' },
  { icon: User, label: 'Profil', path: '/profile' },
];

interface BottomNavProps {
  role: 'parent' | 'babysitter';
}

export function BottomNav({ role }: BottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const items = role === 'parent' ? PARENT_ITEMS : BABYSITTER_ITEMS;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t safe-area-bottom">
      <div className="max-w-2xl mx-auto flex">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 pt-2.5 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
