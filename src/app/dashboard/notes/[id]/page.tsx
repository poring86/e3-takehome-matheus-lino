'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../lib/auth-context';
import { ProtectedRoute } from '../../../../components/protected-route';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Avatar, AvatarFallback } from '../../../../components/ui/avatar';
import { ArrowLeft, Save, Edit3, Eye, EyeOff, History, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';

interface Note {
  id: string;
  title: string;
  content?: string;
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    email: string;
    fullName?: string;
  };
}

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
        editor?.commands.setContent(data.content || '');
      } else if ([401, 403, 404].includes(response.status)) {
        router.push('/dashboard/notes');
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setLoading(false);
    }
  }, [params.id, router, editor, session?.access_token]);

  useEffect(() => {
    fetchNote();
  }, [fetchNote]);

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

  const isAuthor = user?.id === note.author.id;
  const currentOrgMember = userOrgs.find(org => org.org_id === currentOrg?.id);
  const canEdit = isAuthor || currentOrgMember?.role === 'admin' || currentOrgMember?.role === 'owner';
  const canDelete = isAuthor || currentOrgMember?.role === 'admin' || currentOrgMember?.role === 'owner';

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
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {editing ? 'Edit Note' : note.title}
                </h1>
                {note.visibility === 'public' ? (
                  <Eye className="h-5 w-5 text-green-600" />
                ) : (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {canEdit && !editing && (
                <>
                  <Button variant="outline" onClick={handleEdit}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/dashboard/notes/${note.id}/versions`}>
                      <History className="h-4 w-4 mr-2" />
                      Versions
                    </Link>
                  </Button>
                  {canDelete && (
                    <Button variant="outline" onClick={handleDelete}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </>
              )}
              {editing && (
                <>
                  <Button variant="outline" onClick={handleCancel} disabled={saving}>
                    Cancel
                  </Button>
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
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Card>
            <CardHeader>
              <div className="space-y-4">
                {editing ? (
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
                ) : (
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{note.title}</CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {note.author.fullName?.charAt(0) || note.author.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span>{note.author.fullName || note.author.email}</span>
                      <span>•</span>
                      <span>Updated {new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
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

export default function NotePage() {
  return (
    <ProtectedRoute>
      <NoteContent />
    </ProtectedRoute>
  );
}