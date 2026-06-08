import { z } from "zod";

export const addNoteSchema = z.object({
  notes: z
    .string()
    .min(5, "Note must be at least 5 characters long")
    .max(1000, "Note content is too long (max 1000 characters)"),
});

export type AddNoteInput = z.infer<typeof addNoteSchema>;

export const completeJobSchema = z.object({
  signatureName: z.string().min(2, "Customer signature name is required"),
  feedbackNotes: z.string().optional(),
  satisfactionRating: z.number().min(1).max(5).default(5),
});

export type CompleteJobInput = z.infer<typeof completeJobSchema>;
