import { z } from 'zod'

export const clientSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  mobile: z.string().optional(),
  address: z.string().optional(),
  dpdpConsent: z.boolean().default(false),
})

export type ClientFormValues = z.infer<typeof clientSchema>
