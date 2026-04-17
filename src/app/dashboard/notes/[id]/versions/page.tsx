'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../lib/auth-context';
import { ProtectedRoute } from '../../../../../components/protected-route';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { ArrowLeft, History, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { diffWords } from 'diff';

interface NoteVersion {
  id: string;
  noteId: string;
  version: number;
  content: string;
  createdAt: string;
}

interface Note {
  id: string;
  title: string;
  visibility: 'public' | 'private';
  author: {
    id: string;
    email: string;
    fullName?: string;
  };
}

function VersionsContent() {
  const params = useParams();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<NoteVersion | null>(null);
  const [diffContent, setDiffContent] = useState<string>('');

  const fetchNoteAndVersions = useCallback(async () => {
    if (authLoading) return;
    if (!params.id) return;

    const noteId = Array.isArray(params.id) ? params.id[0] : params.id;

    const headers: HeadersInit = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    try {
      const noteResponse = await fetch(`/api/notes/${noteId}`, {
        credentials: 'include',
        headers,
      });
      if (noteResponse.ok) {
        const noteData = await noteResponse.json();
        if (!noteData || !noteData.id) {
          throw new Error('Invalid note data received.');
        }
        setNote(noteData);
      } else if ([401, 403, 404].includes(noteResponse.status)) {
        router.push('/dashboard/notes');
        return;
      } else {
        console.error(`Failed to fetch note: ${noteResponse.status}`);
        setLoading(false);
        return;
      }

      const versionsResponse = await fetch(`/api/notes/${noteId}/versions`, {
        credentials: 'include',
        headers,
      });
      if (versionsResponse.ok) {
        const versionsData = await versionsResponse.json();
        if (!Array.isArray(versionsData)) {
          throw new Error('Invalid versions data received.');
        }
        setVersions(versionsData);
        if (versionsData.length > 0) {
          setSelectedVersion(versionsData[0]);
        }
      } else {
        console.error(`Failed to fetch versions: ${versionsResponse.status}`);
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      router.push('/dashboard/notes');
    } finally {
      setLoading(false);
    }
  }, [authLoading, params.id, router, session?.access_token]);

  useEffect(() => {
    fetchNoteAndVersions();
  }, [fetchNoteAndVersions]);

  useEffect(() => {
    if (selectedVersion && versions.length > 0) {
      const currentIndex = versions.findIndex(v => v.id === selectedVersion.id);
      const previousVersion = versions[currentIndex + 1]; // Next in array is previous version

      if (previousVersion) {
        const diff = diffWords(previousVersion.content || '', selectedVersion.content || '');
        const diffHtml = diff.map(part => {
          if (part.added) {
            return `<span class="bg-green-200 text-green-800">${part.value}</span>`;
          } else if (part.removed) {
            return `<span class="bg-red-200 text-red-800 line-through">${part.value}</span>`;
          } else {
            return part.value;
          }
        }).join('');

        setDiffContent(diffHtml);
      } else {
        // First version, no diff
        setDiffContent(selectedVersion.content || '');
      }
    }
  }, [selectedVersion, versions]);

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" asChild>
                <Link href={`/dashboard/notes/${note.id}`}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Note
                </Link>
              </Button>
              <div className="flex items-center space-x-2">
                <History className="h-5 w-5 text-gray-500" />
                <h1 className="text-2xl font-bold text-gray-900">Version History</h1>
                <span className="text-gray-500">•</span>
                <span className="text-gray-700">{note.title}</span>
                {note.visibility === 'public' ? (
                  <Eye className="h-5 w-5 text-green-600" />
                ) : (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Versions list */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Versions ({versions.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {versions.map((version) => (
                  <div
                    key={version.id}
                    className={`p-3 rounded-md cursor-pointer border transition-colors ${selectedVersion?.id === version.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                      }`}
                    onClick={() => setSelectedVersion(version)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Version {version.version}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(version.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Version content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {selectedVersion ? `Version ${selectedVersion.version}` : 'Select a version'}
                  </CardTitle>
                  {selectedVersion && (
                    <span className="text-sm text-gray-500">
                      {new Date(selectedVersion.createdAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {selectedVersion ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Changes</h4>
                      <div
                        className="prose prose-sm max-w-none border rounded-md p-4 bg-gray-50"
                        dangerouslySetInnerHTML={{ __html: diffContent }}
                      />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Full Content</h4>
                      <div
                        className="prose prose-sm max-w-none border rounded-md p-4"
                        dangerouslySetInnerHTML={{ __html: selectedVersion.content || '<em>No content</em>' }}
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Select a version to view its content and changes.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function VersionsPage() {
  return (
    <ProtectedRoute>
      <VersionsContent />
    </ProtectedRoute>
  );
}