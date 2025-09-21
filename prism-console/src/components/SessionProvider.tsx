import { createContext, useContext, useEffect, useState } from 'react';
import { type Session, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const SessionContext = createContext<{ session: Session | null, supabase: SupabaseClient, loading: boolean }>({ session: null, supabase, loading: true });

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, supabase, loading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
