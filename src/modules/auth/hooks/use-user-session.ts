import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../../../lib/supabase-client";

type UseUserSessionOptions = {
  onError?: (message: string) => void;
};

export function useUserSession(options?: UseUserSessionOptions) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (error) {
        setError(error.message);
      }
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!error) {
      return;
    }
    options?.onError?.(error);
  }, [error, options]);

  return { user, session, loading, error };
}
