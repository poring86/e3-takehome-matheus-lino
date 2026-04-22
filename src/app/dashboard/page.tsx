
'use client';

import { useUserSession, useSignOut } from '../../modules/auth';
import { useCurrentOrg, useSwitchOrg } from '../../modules/organization';
import { ProtectedRoute } from '../../components/protected-route';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { LogOut, Building2, Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';





function DashboardContent() {
  const { user } = useUserSession();
  const { currentOrg, userOrgs, refreshOrganizations, setCurrentOrgId, loading } = useCurrentOrg();
  const safeUserOrgs = userOrgs ?? [];
  const switchOrg = useSwitchOrg({
    onSwitched: () => refreshOrganizations(),
  });
  const signOut = useSignOut;
  const router = useRouter();
  const activeOrg = currentOrg || (Array.isArray(userOrgs) && userOrgs[0]?.organizations) || null;

  const handleSignOut = async () => {
    await signOut();
  };

  // DEBUG: log states para investigar flicker
  if (typeof window !== 'undefined') {
    console.log('[DEBUG] currentOrg:', currentOrg, '| userOrgs:', userOrgs, '| loading:', loading, '| activeOrg:', activeOrg, '| user:', user);
  }


  // Loader removido: já existe spinner global em ProtectedRoute

  // Welcome só aparece se user, currentOrg e userOrgs já carregaram e não há org
  if (
    typeof user !== 'undefined' &&
    typeof currentOrg !== 'undefined' &&
    typeof userOrgs !== 'undefined' &&
    user &&
    currentOrg === null &&
    Array.isArray(userOrgs) &&
    userOrgs.length === 0
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card>
          <CardHeader>
            <CardTitle>Welcome!</CardTitle>
            <CardDescription>
              You need to create or join an organization to get started.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/onboarding')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Team Notes</h1>
              {activeOrg && (
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">{activeOrg.name}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <Avatar>
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeOrg ? (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Welcome to {activeOrg.name}</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your team&apos;s notes and collaborate effectively.
                </p>
              </div>

              {/* Organization switcher */}
              {safeUserOrgs.length > 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Switch Organization</CardTitle>
                    <CardDescription>
                      Select which organization you want to work with
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {safeUserOrgs.map((orgMember) => (
                        <Button
                          key={orgMember.org_id}
                          variant={activeOrg?.id === orgMember.org_id ? "default" : "outline"}
                          onClick={async () => {
                            setCurrentOrgId(orgMember.org_id); // troca instantânea
                            await switchOrg(orgMember.org_id);
                          }}
                          className="justify-start"
                        >
                          <Building2 className="h-4 w-4 mr-2" />
                          {orgMember.organizations?.name ?? "Organization"}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Placeholder for notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                  <CardDescription>
                    Your team&apos;s notes will appear here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <Link href="/dashboard/notes">
                      <Plus className="h-4 w-4 mr-2" />
                      View Notes
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  const { userOrgs, loading } = useCurrentOrg();
  // O ProtectedRoute controla todo o loading e redirecionamento
  // Agora também espera userOrgs estar pronto
  return (
    <ProtectedRoute requireOrg={false} extraLoading={loading || typeof userOrgs === 'undefined'}>
      <DashboardContent />
    </ProtectedRoute>
  );
}