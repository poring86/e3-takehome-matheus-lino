'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserSession } from '../../../../modules/auth';
import { useCurrentOrg } from '../../../../modules/organization';
import { ProtectedRoute } from '../../../../components/protected-route';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Card, CardContent, CardHeader } from '../../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { ArrowLeft, Save, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { useQueryClient } from '@tanstack/react-query';

function NewNoteContent() {
  const { currentOrg } = useCurrentOrg();
  const { session } = useUserSession();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const queryClient = useQueryClient();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      LinkExtension.configure({
        openOnClick: false,
      }),
      Highlight,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  const handleSave = async () => {
    if (!title.trim() || !currentOrg) return;

    setSaving(true);
    setErrorMessage('');

    const requestController = new AbortController();
    const requestTimeoutMs = 20000;
    const requestTimeoutId = window.setTimeout(
      () => requestController.abort(),
      requestTimeoutMs,
    );

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Prefer the already-hydrated auth context session to avoid extra async auth lookups on submit.
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/notes?orgId=${currentOrg.id}`, {
        method: 'POST',
        credentials: 'include',
        signal: requestController.signal,
        headers,
        body: JSON.stringify({
          title: title.trim(),
          content: editor?.getHTML() || '',
          visibility,
        }),
      });

      if (response.ok) {
        const note = await response.json();
        // Invalida a query de listagem de notas para atualizar automaticamente
        queryClient.invalidateQueries({ queryKey: ['notes'] });
        router.push(`/dashboard/notes/${note.id}`);
      } else {
        const payload = await response.json().catch(() => null);
        const textBody = payload ? '' : await response.text().catch(() => '');
        const apiError = payload?.error || textBody || 'Failed to create note';
        setErrorMessage(apiError);
        console.error('Failed to create note:', response.status, payload);
      }
    } catch (error) {
      console.error('Error creating note:', error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        setErrorMessage(
          `Request timed out after ${requestTimeoutMs / 1000}s. Please try again.`,
        );
      } else if (error instanceof Error) {
        setErrorMessage(error.message || 'Unexpected error while creating note');
      } else {
        setErrorMessage('Unexpected error while creating note');
      }
    } finally {
      window.clearTimeout(requestTimeoutId);
      setSaving(false);
    }
  };

  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">No organization selected</h2>
          <p className="mt-2 text-gray-600">Please select an organization to create notes.</p>
        </div>
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
              <Button variant="ghost" asChild>
                <Link href="/dashboard/notes">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Notes
                </Link>
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">New Note</h1>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={visibility} onValueChange={(value: 'public' | 'private') => setVisibility(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">
                    <div className="flex items-center">
                      <EyeOff className="h-4 w-4 mr-2" />
                      Private
                    </div>
                  </SelectItem>
                  <SelectItem value="public">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 mr-2" />
                      Public
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleSave} disabled={saving || !title.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {errorMessage ? (
            <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter note title..."
                    className="text-xl font-semibold"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label>Content</Label>
                <div className="border rounded-md">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function NewNotePage() {
  return (
    <ProtectedRoute>
      <NewNoteContent />
    </ProtectedRoute>
  );
}