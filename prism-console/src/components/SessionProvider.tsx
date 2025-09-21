import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { type Session, SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type SessionContextType = {
  session: Session | null;
  supabase: SupabaseClient;
  loading: boolean;
};

const SessionContext = createContext<SessionContextType>({
  session: null,
  supabase,
  loading: true,
});

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false); // Set loading to false here
    });
    supabase.auth.getSession();


    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      supabase,
      loading,
    }),
    [session, loading]
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => useContext(SessionContext);
