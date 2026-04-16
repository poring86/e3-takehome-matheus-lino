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
      const { data: memberships, error: membershipsError } = await supabase
        .from('org_members')
        .select('id, org_id, user_id, role, joined_at')
        .eq('user_id', userId);

      if (membershipsError) throw membershipsError;

      if (!memberships || memberships.length === 0) {
        setUserOrgs([]);
        setCurrentOrg(null);
        localStorage.removeItem('currentOrgId');
        return;
      }

      const orgIds = Array.from(new Set(memberships.map(member => member.org_id)));
      const { data: organizationsData, error: organizationsError } = await supabase
        .from('organizations')
        .select('id, name, created_at')
        .in('id', orgIds);

      if (organizationsError) throw organizationsError;

      const organizationsById = new Map(
        (organizationsData || []).map(org => [org.id, org as Organization])
      );

      const orgs: OrgMember[] = memberships
        .map(member => {
          const organization = organizationsById.get(member.org_id);
          if (!organization) return null;

          return {
            ...member,
            organizations: organization,
          } as OrgMember;
        })
        .filter((member): member is OrgMember => member !== null);

      setUserOrgs(orgs);

      // Set current org to first one or from localStorage
      const storedOrgId = localStorage.getItem('currentOrgId');
      const current = orgs.find(org => org.org_id === storedOrgId) || orgs[0];
      setCurrentOrg(current?.organizations || null);

      if (!current) {
        localStorage.removeItem('currentOrgId');
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? { message: error.message, name: error.name }
          : typeof error === 'object' && error !== null
            ? error
            : { message: String(error) };

      console.error('Error loading organizations:', errorMessage);
      setUserOrgs([]);
      setCurrentOrg(null);
      localStorage.removeItem('currentOrgId');
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