import { z } from "zod";

// Note schema
export const noteSchema = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  title: z.string().min(1),
  content: z.string().optional(),
  visibility: z.enum(["public", "private", "shared"]),
  summary: z.string().nullable().optional(),
  summaryStatus: z.enum(["pending", "accepted", "rejected"]).optional(),
  createdBy: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().optional(),
  visibility: z.enum(["public", "private", "shared"]).default("private"),
  tags: z.array(z.string().min(1)).optional(),
  sharedWith: z.array(z.string().uuid()).optional(),
});

export const updateNoteSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().optional(),
  visibility: z.enum(["public", "private", "shared"]).optional(),
  tags: z.array(z.string().min(1)).optional(),
  sharedWith: z.array(z.string().uuid()).optional(),
});

export type Note = z.infer<typeof noteSchema>;
export type CreateNote = z.infer<typeof createNoteSchema>;
export type UpdateNote = z.infer<typeof updateNoteSchema>;
