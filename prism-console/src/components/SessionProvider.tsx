import { createContext, useContext, useEffect, useState } from 'react';
import { type Session, SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const SessionContext = createContext<{ session: Session | null, supabase: SupabaseClient }>({ session: null, supabase });

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, supabase }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
