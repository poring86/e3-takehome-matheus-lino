'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/auth-context';
import { ProtectedRoute } from '../../../../components/protected-route';
import { Label } from '../../../../components/ui/label';
import { Card, CardContent, CardHeader } from '../../../../components/ui/card';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import { NotePageHeader } from './components/note-page-header';
import { NoteCardTitle } from './components/note-card-title';
import { AISummaryPanel } from './components/ai-summary-panel';
import { NotePageProvider } from './components/note-page-context';
import type { Note } from './components/types';

function NoteContent() {
  const params = useParams();
  const router = useRouter();
  const { user, currentOrg, userOrgs, session } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [saving, setSaving] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [updatingSummary, setUpdatingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

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
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
  });

  const fetchNote = useCallback(async () => {
    if (!params.id) return;

    try {
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/notes/${params.id}`, {
        credentials: 'include',
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setNote(data);
        setTitle(data.title);
        setVisibility(data.visibility);
      } else if ([401, 403, 404].includes(response.status)) {
        router.push('/dashboard/notes');
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id, router, session?.access_token]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

  useEffect(() => {
    if (!editor || !note) return;
    editor.commands.setContent(note.content || '');
  }, [editor, note]);

  const handleEdit = () => {
    setEditing(true);
    editor?.setEditable(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setTitle(note?.title || '');
    setVisibility(note?.visibility || 'private');
    editor?.commands.setContent(note?.content || '');
    editor?.setEditable(false);
  };

  const handleSave = async () => {
    if (!note || !title.trim()) return;

    setSaving(true);
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          title: title.trim(),
          content: editor?.getHTML() || '',
          visibility,
        }),
      });

      if (response.ok) {
        const updatedNote = await response.json();
        setNote(updatedNote);
        setEditing(false);
        editor?.setEditable(false);
        // Refresh to get updated timestamp
        fetchNote();
      } else {
        console.error('Failed to update note');
      }
    } catch (error) {
      console.error('Error updating note:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!note || !confirm('Are you sure you want to delete this note?')) return;

    try {
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/notes/${note.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        router.push('/dashboard/notes');
      } else {
        console.error('Failed to delete note');
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleGenerateSummary = async () => {
    if (!note || summarizing) return;

    setSummarizing(true);
    setSummaryError(null);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/notes/${note.id}/summarize`, {
        method: 'POST',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setSummaryError(errorData?.error || 'Failed to generate summary');
        return;
      }

      const data = await response.json();
      setNote((prev) => prev ? {
        ...prev,
        summary: data.summary,
        summaryStatus: 'pending',
      } : prev);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummaryError('Error generating summary');
    } finally {
      setSummarizing(false);
    }
  };

  const handleSummaryDecision = async (action: 'accept' | 'reject') => {
    if (!note || updatingSummary) return;

    setUpdatingSummary(true);
    setSummaryError(null);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`/api/notes/${note.id}/summarize`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setSummaryError(errorData?.error || 'Failed to update summary status');
        return;
      }

      const data = await response.json();
      setNote((prev) => prev ? {
        ...prev,
        summaryStatus: data.status,
      } : prev);
    } catch (error) {
      console.error('Error updating summary status:', error);
      setSummaryError('Error updating summary status');
    } finally {
      setUpdatingSummary(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Note not found</h2>
          <p className="mt-2 text-gray-600">The note you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
        </div>
      </div>
    );
  }

  const isAuthor = user?.id && note?.author?.id && user.id === note.author.id;
  const currentOrgMember = userOrgs.find(org => org.org_id === currentOrg?.id);
  const canEdit = isAuthor || currentOrgMember?.role === 'admin' || currentOrgMember?.role === 'owner';
  const canDelete = isAuthor || currentOrgMember?.role === 'admin' || currentOrgMember?.role === 'owner';
  const contextValue = {
    note,
    editing,
    title,
    visibility,
    saving,
    canEdit: !!canEdit,
    canDelete: !!canDelete,
    isAuthor: !!isAuthor,
    summarizing,
    updatingSummary,
    summaryError,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onCancel: handleCancel,
    onSave: handleSave,
    onVisibilityChange: setVisibility,
    onTitleChange: setTitle,
    onGenerateSummary: handleGenerateSummary,
    onSummaryDecision: handleSummaryDecision,
  };

  return (
    <NotePageProvider value={contextValue}>
      <div className="min-h-screen bg-gray-50">
        <NotePageHeader />

        {/* Main content */}
        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <Card>
              <CardHeader>
                <div className="space-y-4">
                  <NoteCardTitle />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Label>Content</Label>
                  <div className="border rounded-md">
                    <EditorContent editor={editor} />
                  </div>

                  <AISummaryPanel />
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </NotePageProvider>
  );
}

export default function NotePage() {
  return (
    <ProtectedRoute>
      <NoteContent />
    </ProtectedRoute>
  );
}