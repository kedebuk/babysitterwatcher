import { MOCK_CHILDREN } from '@/lib/mock-data';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, LogOut, BarChart3 } from 'lucide-react';
import { format, parseISO, differenceInMonths } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

const ParentChildren = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen pb-6">
      <div className="sticky top-0 z-10 bg-primary px-4 py-3 text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Anak Saya</h1>
            <p className="text-xs opacity-80">{user?.name}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={() => navigate('/parent/dashboard')}>
              <BarChart3 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary-foreground/20" onClick={logout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3 max-w-2xl mx-auto">
        {MOCK_CHILDREN.map(child => {
          const age = differenceInMonths(new Date(), parseISO(child.dob));
          return (
            <Card key={child.id} className="border-0 shadow-sm animate-fade-in cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/parent/dashboard')}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-2xl">
                  {child.avatar_emoji || '👶'}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base">{child.name}</h3>
                  <p className="text-xs text-muted-foreground">{age} bulan • Lahir {format(parseISO(child.dob), 'd MMM yyyy', { locale: idLocale })}</p>
                  {child.notes && <p className="text-xs text-accent mt-0.5">⚠️ {child.notes}</p>}
                </div>
              </CardContent>
            </Card>
          );
        })}

        <Button variant="outline" className="w-full h-14 border-dashed text-muted-foreground">
          <Plus className="mr-2 h-5 w-5" /> Tambah Anak
        </Button>
      </div>
    </div>
  );
};

export default ParentChildren;
