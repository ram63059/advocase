import { z } from 'zod'

export const reminderSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly']).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  reminderTime: z.string().optional(),
  dayOfWeek: z.string().optional(),
  sendEmail: z.boolean().default(true),
  emailTo: z.string().email().optional().or(z.literal('')),
  sendSms: z.boolean().default(false),
  mobileTo: z.string().optional(),
  caseId: z.string().optional().nullable(),
  clientId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
})

export type ReminderFormValues = z.infer<typeof reminderSchema>
