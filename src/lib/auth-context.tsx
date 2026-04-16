'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase-client';

interface Organization {
  id: string;
  name: string;
  created_at: string;
}

interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  organizations: Organization;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  currentOrg: Organization | null;
  userOrgs: OrgMember[];
  switchOrg: (orgId: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [userOrgs, setUserOrgs] = useState<OrgMember[]>([]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        await loadUserOrganizations(session.user.id);
      } else {
        setUserOrgs([]);
        setCurrentOrg(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserOrganizations = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('org_members')
        .select(`
          *,
          organizations (*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      const orgs = data as OrgMember[];
      setUserOrgs(orgs);

      // Set current org to first one or from localStorage
      const storedOrgId = localStorage.getItem('currentOrgId');
      const current = orgs.find(org => org.org_id === storedOrgId) || orgs[0];
      setCurrentOrg(current?.organizations || null);
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const switchOrg = (orgId: string) => {
    const org = userOrgs.find(o => o.org_id === orgId);
    if (org) {
      setCurrentOrg(org.organizations);
      localStorage.setItem('currentOrgId', orgId);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('currentOrgId');
  };

  const value = {
    user,
    session,
    loading,
    currentOrg,
    userOrgs,
    switchOrg,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}