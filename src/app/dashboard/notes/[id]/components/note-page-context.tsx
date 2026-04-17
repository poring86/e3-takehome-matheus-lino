'use client';

import { createContext, useContext } from 'react';
import type { Note } from './types';

type NotePageContextValue = {
  note: Note;
  editing: boolean;
  title: string;
  visibility: 'public' | 'private';
  saving: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isAuthor: boolean;
  summarizing: boolean;
  updatingSummary: boolean;
  summaryError: string | null;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onCancel: () => void;
  onSave: () => Promise<void>;
  onVisibilityChange: (value: 'public' | 'private') => void;
  onTitleChange: (value: string) => void;
  onGenerateSummary: () => Promise<void>;
  onSummaryDecision: (action: 'accept' | 'reject') => Promise<void>;
};

const NotePageContext = createContext<NotePageContextValue | null>(null);

type NotePageProviderProps = {
  value: NotePageContextValue;
  children: React.ReactNode;
};

export function NotePageProvider({ value, children }: NotePageProviderProps) {
  return <NotePageContext.Provider value={value}>{children}</NotePageContext.Provider>;
}

export function useNotePageContext() {
  const context = useContext(NotePageContext);

  if (!context) {
    throw new Error('useNotePageContext must be used within NotePageProvider');
  }

  return context;
}