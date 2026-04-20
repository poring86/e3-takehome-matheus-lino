'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase-client';
import { useUserSession } from '../../modules/auth';
import { ProtectedRoute } from '../../components/protected-route';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Loader2, Building2 } from 'lucide-react';

const createOrgSchema = z.object({
  name: z.string().min(1, 'Organization name is required'),
});

type CreateOrgForm = z.infer<typeof createOrgSchema>;

function OnboardingContent() {
  const [error, setError] = useState<string | null>(null);
  const { user } = useUserSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrgForm>({
    resolver: zodResolver(createOrgSchema),
  });

  const createOrgMutation = useMutation<void, Error, CreateOrgForm>({
    mutationFn: async (data: CreateOrgForm) => {
      if (!user) throw new Error('User not authenticated');
      const orgId = crypto.randomUUID();

      // Create organization
      const { error: orgError } = await supabase
        .from('organizations')
        .insert({ id: orgId, name: data.name });
      if (orgError) {
        // Trata erro de constraint UNIQUE
        if (orgError.code === '23505' || orgError.message?.toLowerCase().includes('unique')) {
          throw new Error('An organization with this name already exists. Please choose another name.');
        }
        throw orgError;
      }

      // Ensure user profile exists before creating membership (FK users.id)
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email,
        });
      if (profileError) throw profileError;

      // Add user as owner
      const { error: memberError } = await supabase
        .from('org_members')
        .insert({
          org_id: orgId,
          user_id: user.id,
          role: 'owner',
        });
      if (memberError) throw memberError;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['organizations'] });
      router.replace('/dashboard');
    },
    onError: (error) => {
      setError(error?.message || 'An error occurred');
    },
  });

  const onSubmit = (data: CreateOrgForm) => {
    setError(null);
    createOrgMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center flex items-center justify-center">
            <Building2 className="h-6 w-6 mr-2" />
            Create Organization
          </CardTitle>
          <CardDescription className="text-center">
            Set up your first organization to get started with team notes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter organization name"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={createOrgMutation.isPending}>
              {createOrgMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Organization
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <ProtectedRoute requireOrg={false}>
      <OnboardingContent />
    </ProtectedRoute>
  );
}