'use client';

import { useState } from 'react';
import { useUserSession, useSignOut } from '../../../modules/auth';
import { useCurrentOrg } from '../../../modules/organization';
import { ProtectedRoute } from '../../../components/protected-route';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Avatar, AvatarFallback } from '../../../components/ui/avatar';
import { LogOut, Building2, Plus, Search, FileText, Eye, EyeOff } from 'lucide-react';
// import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

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

function NotesContent() {
  const { user, session } = useUserSession();
  const { currentOrg } = useCurrentOrg();
  const signOut = useSignOut;
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [notesPerPage, setNotesPerPage] = useState(20);

  const handleSignOut = async () => {
    await signOut();
  };

  const notesQuery = useQuery<{ notes: Note[]; total: number }>({
    queryKey: ['notes', currentOrg?.id, currentPage, notesPerPage, appliedQuery, session?.access_token],
    enabled: Boolean(currentOrg),
    queryFn: async () => {
      if (!currentOrg) {
        return { notes: [], total: 0 };
      }

      const offset = (currentPage - 1) * notesPerPage;
      const url = `/api/notes?orgId=${currentOrg.id}&limit=${notesPerPage}&offset=${offset}${appliedQuery ? `&q=${encodeURIComponent(appliedQuery)}` : ''}`;
      const headers: HeadersInit = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const response = await fetch(url, {
        credentials: 'include',
        headers,
      });

      if (response.ok) {
        return (await response.json()) as { notes: Note[]; total: number };
      }

      if (response.status === 401 || response.status === 403) {
        return { notes: [], total: 0 };
      }

      throw new Error('Failed to fetch notes');
    },
  });

  const notes = notesQuery.data?.notes ?? [];
  const totalNotes = notesQuery.data?.total ?? 0;
  const loading = notesQuery.isLoading || notesQuery.isFetching;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setAppliedQuery(searchQuery);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">No organization selected</h2>
          <p className="mt-2 text-gray-600">Please select an organization to view notes.</p>
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
              <Link href="/dashboard" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
                Team Notes
              </Link>
              {currentOrg && (
                <div className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-gray-500" />
                  <span className="text-gray-700">{currentOrg.name}</span>
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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your team&apos;s notes and collaborate effectively.
              </p>
            </div>
            <Button asChild>
              <Link href="/dashboard/notes/new">
                <Plus className="h-4 w-4 mr-2" />
                New Note
              </Link>
            </Button>
          </div>

          {/* Search e seletor de itens por página */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <form onSubmit={handleSearch} className="relative w-full sm:w-1/2">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </form>
            <div className="flex items-center gap-2">
              <Label htmlFor="notes-per-page" className="text-sm">Notas por página:</Label>
              <select
                id="notes-per-page"
                className="border rounded px-2 py-1 text-sm"
                value={notesPerPage}
                onChange={e => {
                  setNotesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Notes grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading notes...</p>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No notes</h3>
              <p className="mt-1 text-sm text-gray-600">
                {appliedQuery ? 'No notes match your search.' : 'Get started by creating a new note.'}
              </p>
              {!appliedQuery && (
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/dashboard/notes/new">
                      <Plus className="h-4 w-4 mr-2" />
                      New Note
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {notes.map((note) => (
                <Card key={note.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg line-clamp-2">
                        <Link
                          href={`/dashboard/notes/${note.id}`}
                          className="hover:text-blue-600 transition-colors"
                        >
                          {note.title}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center space-x-1 ml-2">
                        {note.visibility === 'public' ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <CardDescription className="line-clamp-3">
                      {note.content || 'No content'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {note.author.fullName?.charAt(0) || note.author.email.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{note.author.fullName || note.author.email}</span>
                      </div>
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalNotes > notesPerPage && (
            <div className="mt-8 flex justify-center">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {Math.ceil(totalNotes / notesPerPage)}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === Math.ceil(totalNotes / notesPerPage)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function NotesPage() {
  return (
    <ProtectedRoute>
      <NotesContent />
    </ProtectedRoute>
  );
}