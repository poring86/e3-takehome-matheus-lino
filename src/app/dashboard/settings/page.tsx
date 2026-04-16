'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth-context';
import { ProtectedRoute } from '../../../components/protected-route';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { supabase } from '../../../lib/supabase-client';
import { Loader2, UserPlus, Trash2, Crown, Shield, Users } from 'lucide-react';

interface OrgMemberWithUser {
  id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  users: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

function SettingsContent() {
  const { currentOrg, user } = useAuth();
  const [members, setMembers] = useState<OrgMemberWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (currentOrg) {
      loadMembers();
    }
  }, [currentOrg]);

  const loadMembers = async () => {
    if (!currentOrg) return;

    try {
      const { data, error } = await supabase
        .from('org_members')
        .select(`
          *,
          users (
            id,
            email,
            full_name
          )
        `)
        .eq('org_id', currentOrg.id);

      if (error) throw error;
      setMembers(data as OrgMemberWithUser[]);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async () => {
    if (!currentOrg || !inviteEmail.trim()) return;

    setInviting(true);
    setError(null);
    setSuccess(null);

    try {
      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', inviteEmail)
        .single();

      if (userError && userError.code !== 'PGRST116') throw userError;

      let userId = existingUser?.id;

      // If user doesn't exist, we can't invite them yet (they need to sign up first)
      if (!userId) {
        setError('User must sign up first before they can be invited to an organization');
        return;
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('org_members')
        .select('id')
        .eq('org_id', currentOrg.id)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        setError('User is already a member of this organization');
        return;
      }

      // Add as member
      const { error: inviteError } = await supabase
        .from('org_members')
        .insert({
          org_id: currentOrg.id,
          user_id: userId,
          role: 'member',
        });

      if (inviteError) throw inviteError;

      setSuccess('User invited successfully');
      setInviteEmail('');
      loadMembers();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  const updateRole = async (memberId: string, newRole: 'owner' | 'admin' | 'member') => {
    try {
      const { error } = await supabase
        .from('org_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      setSuccess('Role updated successfully');
      loadMembers();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update role');
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('org_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setSuccess('Member removed successfully');
      loadMembers();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to remove member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentOrg) {
    return <div>No organization selected</div>;
  }

  const currentUserMember = members.find(m => m.user_id === user?.id);
  const canManageMembers = currentUserMember?.role === 'owner' || currentUserMember?.role === 'admin';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage {currentOrg.name} members and settings
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Members Management */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Manage organization members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback>
                          {member.users.full_name?.charAt(0).toUpperCase() ||
                            member.users.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.users.full_name || member.users.email}
                        </p>
                        <p className="text-sm text-gray-500">{member.users.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(member.role)}
                        <span className="text-sm capitalize">{member.role}</span>
                      </div>

                      {canManageMembers && member.user_id !== user?.id && (
                        <div className="flex items-center space-x-2">
                          <Select
                            value={member.role}
                            onValueChange={(value: 'owner' | 'admin' | 'member') =>
                              updateRole(member.id, value)
                            }
                          >
                            <SelectTrigger className="w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="member">Member</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              {currentUserMember?.role === 'owner' && (
                                <SelectItem value="owner">Owner</SelectItem>
                              )}
                            </SelectContent>
                          </Select>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {canManageMembers && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Enter email address"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={inviteUser} disabled={inviting}>
                      {inviting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    User must have signed up first before they can be invited
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute requireOrg={true}>
      <SettingsContent />
    </ProtectedRoute>
  );
}