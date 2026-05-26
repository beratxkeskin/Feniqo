import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../db/supabaseClient';
import type { Profile } from '../db/types';

interface AuthContextType {
  user: Profile | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password?: string, forceDemo?: boolean) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password?: string, fullName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Check initial session
  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Try Supabase first if configured
      if (isSupabaseConfigured && supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            // Fetch profile
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const savedLang = (localStorage.getItem('feniqo_lang') || localStorage.getItem('moneymate_lang') as 'tr' | 'en') || 'tr';
            setUser({
              id: session.user.id,
              email: session.user.email || '',
              full_name: profileData?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
              currency: (profileData?.currency as any) || 'TRY',
              theme: (profileData?.theme as any) || 'system',
              lang: profileData?.lang || savedLang,
              active_workspace_id: profileData?.active_workspace_id || null,
            });
            setIsDemo(false);
          } else {
            // Check if there is a local demo session
            checkDemoSession();
          }
        } catch (e) {
          console.error("Supabase auth error, falling back to demo check", e);
          checkDemoSession();
        }
      } else {
        // 2. No Supabase, fall back to local demo check
        checkDemoSession();
      }
      setLoading(false);
    };

    const checkDemoSession = () => {
      const storedDemo = localStorage.getItem('feniqo_demo_user') || localStorage.getItem('moneymate_demo_user');
      if (storedDemo) {
        const parsed = JSON.parse(storedDemo);
        const savedLang = (localStorage.getItem('feniqo_lang') || localStorage.getItem('moneymate_lang') as 'tr' | 'en') || 'tr';
        setUser({ ...parsed, lang: parsed.lang || savedLang });
        setIsDemo(true);
      } else {
        setUser(null);
        setIsDemo(false);
      }
    };

    initializeAuth();

    if (isSupabaseConfigured && supabase) {
      const client = supabase;
      const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          const { data: profileData } = await client
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          const savedLang = (localStorage.getItem('feniqo_lang') || localStorage.getItem('moneymate_lang') as 'tr' | 'en') || 'tr';
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            full_name: profileData?.full_name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || '',
            currency: (profileData?.currency as any) || 'TRY',
            theme: (profileData?.theme as any) || 'system',
            lang: profileData?.lang || savedLang,
            active_workspace_id: profileData?.active_workspace_id || null,
          });
          setIsDemo(false);
        } else {
          // Only clear if we were not in demo mode
          if (!localStorage.getItem('feniqo_demo_user') && !localStorage.getItem('moneymate_demo_user')) {
            setUser(null);
          }
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  // Sign In
  const signIn = async (email: string, password?: string, forceDemo: boolean = false) => {
    setLoading(true);

    // Force Demo Mode or if Supabase is not configured
    if (forceDemo || !isSupabaseConfigured || !supabase) {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const savedLang = (localStorage.getItem('feniqo_lang') || localStorage.getItem('moneymate_lang') as 'tr' | 'en') || 'tr';
      const mockUser: Profile = {
        id: 'demo-user-123',
        email: email || 'demo@feniqo.com',
        full_name: email ? email.split('@')[0] : 'Demo Kullanıcı',
        currency: 'TRY',
        theme: 'system',
        lang: savedLang,
        active_workspace_id: null,
      };
      
      localStorage.setItem('feniqo_demo_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setIsDemo(true);
      setLoading(false);
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: password || '',
      });

      if (error) throw error;

      // Profile is loaded by onAuthStateChange trigger
      setLoading(false);
      return { success: true };
    } catch (error: any) {
      setLoading(false);
      return { success: false, error: error.message || 'Giriş yapılırken bir hata oluştu.' };
    }
  };

  // Sign Up
  const signUp = async (email: string, password?: string, fullName?: string) => {
    setLoading(true);

    // If Supabase not configured, register as a demo user
    if (!isSupabaseConfigured || !supabase) {
      await new Promise(resolve => setTimeout(resolve, 800));
      const savedLang = (localStorage.getItem('feniqo_lang') || localStorage.getItem('moneymate_lang') as 'tr' | 'en') || 'tr';
      const mockUser: Profile = {
        id: 'demo-user-123',
        email,
        full_name: fullName || email.split('@')[0],
        currency: 'TRY',
        theme: 'system',
        lang: savedLang,
        active_workspace_id: null,
      };
      localStorage.setItem('feniqo_demo_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setIsDemo(true);
      setLoading(false);
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password: password || '',
        options: {
          data: {
            full_name: fullName || email.split('@')[0],
          }
        }
      });

      if (error) throw error;

      setLoading(false);
      return { success: true };
    } catch (error: any) {
      setLoading(false);
      return { success: false, error: error.message || 'Kayıt olunurken bir hata oluştu.' };
    }
  };

  // Sign Out
  const signOut = async () => {
    setLoading(true);
    try {
      if (isDemo) {
        localStorage.removeItem('feniqo_demo_user');
        localStorage.removeItem('moneymate_demo_user');
        setUser(null);
        setIsDemo(false);
      } else if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
        setUser(null);
      }
    } catch (e) {
      console.error("Çıkış yaparken hata oluştu:", e);
      // Hata olsa bile kullanıcıyı yerel olarak çıkış yapmış sayalım
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Update Profile
  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { success: false, error: 'Kullanıcı oturumu bulunamadı.' };

    const updatedUser = { ...user, ...updates };

    if (updates.lang) {
      localStorage.setItem('feniqo_lang', updates.lang);
    }

    if (isDemo) {
      localStorage.setItem('feniqo_demo_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return { success: true };
    }

    if (isSupabaseConfigured && supabase) {
      try {
        const updateFields: any = {};
        if (updates.currency !== undefined) updateFields.currency = updates.currency;
        if (updates.theme !== undefined) updateFields.theme = updates.theme;
        if (updates.active_workspace_id !== undefined) updateFields.active_workspace_id = updates.active_workspace_id;
        if (updates.full_name !== undefined) updateFields.full_name = updates.full_name;
        if (updates.lang !== undefined) updateFields.lang = updates.lang;

        if (updates.full_name !== undefined) {
          try {
            await supabase.auth.updateUser({
              data: { full_name: updates.full_name }
            });
          } catch (e) {
            console.error("Auth metadata update failed:", e);
          }
        }

        const { error } = await supabase
          .from('profiles')
          .update(updateFields)
          .eq('id', user.id);

        if (error) throw error;

        setUser(updatedUser);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message || 'Profil güncellenirken hata oluştu.' };
      }
    }

    return { success: false, error: 'Sistem hatası.' };
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemo, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
