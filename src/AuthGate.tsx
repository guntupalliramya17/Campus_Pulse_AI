
import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import LoginPage from './LoginPage';

type AuthGateProps = {
  children: React.ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Could not check staff session:', error.message);
      }

      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-midnight-950 text-midnight-100">
        Checking staff access...
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between border-b border-midnight-700 bg-midnight-950 px-4 py-3 text-sm text-midnight-100">
        <span>Campus Pulse AI · Staff Workspace</span>
        <button
          onClick={() => supabase.auth.signOut()}
          className="rounded-lg border border-midnight-700 px-3 py-1.5 hover:bg-midnight-800"
        >
          Sign out
        </button>
      </div>
      {children}
    </div>
  );
}
