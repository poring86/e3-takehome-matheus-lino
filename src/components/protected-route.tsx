'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserSession } from '@/modules/auth';
import { useCurrentOrg } from '@/modules/organization';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOrg?: boolean;
}

export function ProtectedRoute({ children, requireOrg = false }: ProtectedRouteProps) {
  const { user, loading } = useUserSession();
  const { currentOrg, loading: orgLoading } = useCurrentOrg();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !orgLoading) {
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      if (requireOrg && !currentOrg) {
        router.push('/onboarding');
        return;
      }
    }
  }, [user, loading, orgLoading, currentOrg, requireOrg, router]);

  if (loading || orgLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireOrg && !currentOrg) {
    return null;
  }

  return <>{children}</>;
}