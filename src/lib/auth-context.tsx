'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase-client';
import { loadUserOrganizations } from './load-user-organizations';

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
  refreshOrganizations: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [userOrgs, setUserOrgs] = useState<OrgMember[]>([]);

  const refreshOrganizations = async () => {
    if (!user) {
      setUserOrgs([]);
      setCurrentOrg(null);
      return;
    }

    try {
      const { orgs, currentOrg } = await loadUserOrganizations(user.id);
      setUserOrgs(orgs as OrgMember[]);
      setCurrentOrg(currentOrg as Organization | null);
    } catch (error) {
      console.error('Error refreshing organizations:', error);
      setUserOrgs([]);
      setCurrentOrg(null);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        try {
          const { orgs, currentOrg } = await loadUserOrganizations(session.user.id);
          setUserOrgs(orgs as OrgMember[]);
          setCurrentOrg(currentOrg as Organization | null);
        } catch (error) {
          console.error('Error loading organizations on init:', error);
          setUserOrgs([]);
          setCurrentOrg(null);
        }
      } else {
        setUserOrgs([]);
        setCurrentOrg(null);
      }

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
        try {
          const { orgs, currentOrg } = await loadUserOrganizations(session.user.id);
          setUserOrgs(orgs as OrgMember[]);
          setCurrentOrg(currentOrg as Organization | null);
        } catch (error) {
          console.error('Error loading organizations on auth change:', error);
          setUserOrgs([]);
          setCurrentOrg(null);
        }
      } else {
        setUserOrgs([]);
        setCurrentOrg(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);


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
    refreshOrganizations,
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
