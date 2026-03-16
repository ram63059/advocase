import { z } from 'zod'

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  dueDate: z.string().optional().nullable(),
  assignedTo: z.string().optional(),
  caseId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
})

export type TaskFormValues = z.infer<typeof taskSchema>
