'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const startedRef = useRef(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  });

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const initRecoverySession = async () => {
      try {
        const hash = window.location.hash.replace(/^#/, '');
        const hashParams = new URLSearchParams(hash);

        const hashError = hashParams.get('error_description') || hashParams.get('error');
        if (hashError) {
          throw new Error(decodeURIComponent(hashError.replace(/\+/g, ' ')));
        }

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        if (type === 'recovery' && accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            const lockContention = sessionError.message.toLowerCase().includes('lock:');
            if (!lockContention) throw sessionError;

            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (!session) throw sessionError;
          }

          // Remove sensitive tokens from URL hash after establishing session.
          window.history.replaceState(null, '', window.location.pathname);
          setReady(true);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setReady(true);
          return;
        }

        throw new Error('Recovery link is missing or invalid. Request a new reset email.');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid recovery link';
        if (message.toLowerCase().includes('otp_expired')) {
          setError('Recovery link expired. Request a new password reset email.');
        } else {
          setError(message);
        }
      } finally {
        setInitializing(false);
      }
    };

    void initRecoverySession();
  }, []);

  const onSubmit = async (data: ResetPasswordForm) => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      });

      if (error) throw error;

      await supabase.auth.signOut();
      router.push('/auth/signin?message=Password updated successfully. Please sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Set a new password</CardTitle>
          <CardDescription className="text-center">Use your recovery link to set a new password</CardDescription>
        </CardHeader>
        <CardContent>
          {initializing && (
            <div className="flex items-center justify-center py-4 text-sm text-gray-600">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating recovery link...
            </div>
          )}

          {!initializing && error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!initializing && ready && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your new password"
                  {...register('password')}
                />
                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm new password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your new password"
                  {...register('confirmPassword')}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update password
              </Button>
            </form>
          )}

          <div className="mt-4 text-center text-sm">
            <Link href="/auth/forgot-password" className="text-blue-600 hover:underline">
              Request another recovery link
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
