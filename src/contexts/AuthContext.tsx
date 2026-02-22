import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

type UserRole = 'parent' | 'babysitter' | 'admin' | 'viewer';

interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole | null;
  roles: UserRole[];
  profileComplete: boolean;
  phoneComplete: boolean;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  activeRole: UserRole | null;
  setActiveRole: (role: UserRole | null) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRoleState] = useState<UserRole | null>(() => {
    const stored = sessionStorage.getItem('activeRole');
    return stored as UserRole | null;
  });

  const setActiveRole = useCallback((role: UserRole | null) => {
    setActiveRoleState(role);
    if (role) {
      sessionStorage.setItem('activeRole', role);
    } else {
      sessionStorage.removeItem('activeRole');
    }
  }, []);

  const fetchUserProfile = useCallback(async (supaUser: SupabaseUser): Promise<AppUser | null> => {
    // Get profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, is_disabled, dob, address, avatar_url, phone')
      .eq('id', supaUser.id)
      .single();

    // Check if user is disabled
    if ((profile as any)?.is_disabled) {
      await supabase.auth.signOut();
      return null;
    }

    // Get all roles
    const { data: rolesData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', supaUser.id);

    const roles = (rolesData || []).map(r => r.role as UserRole);
    const role = roles[0] || null;
    
    // For babysitter, check if profile is complete (name, dob, address filled)
    const profileComplete = role !== 'babysitter' || !!(
      profile?.name && profile.name.trim() !== '' &&
      (profile as any)?.dob &&
      (profile as any)?.address && (profile as any).address.trim() !== ''
    );

    // Check if phone number is filled
    const phoneComplete = !!(profile as any)?.phone && (profile as any).phone.trim() !== '';

    return {
      id: supaUser.id,
      email: supaUser.email || '',
      name: profile?.name || supaUser.email?.split('@')[0] || '',
      role,
      roles,
      profileComplete,
      phoneComplete,
    };
  }, []);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Use setTimeout to avoid potential deadlock with Supabase client
        setTimeout(async () => {
          const appUser = await fetchUserProfile(session.user);
          setUser(appUser);
          setLoading(false);
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Then check initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const appUser = await fetchUserProfile(session.user);
        setUser(appUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchUserProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    
    // Check if disabled
    if (signInData.user) {
      const { data: profile } = await supabase.from('profiles').select('is_disabled').eq('id', signInData.user.id).single();
      if ((profile as any)?.is_disabled) {
        await supabase.auth.signOut();
        return { success: false, error: 'Akun Anda telah dinonaktifkan. Hubungi admin.' };
      }
    }
    return { success: true };
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string, role: UserRole) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const appUser = await fetchUserProfile(session.user);
      setUser(appUser);
    }
  }, [fetchUserProfile]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveRoleState(null);
    sessionStorage.removeItem('activeRole');
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, activeRole, setActiveRole, login, signup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
