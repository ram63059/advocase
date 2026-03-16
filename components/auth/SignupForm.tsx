'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  officeName: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type SignupValues = z.infer<typeof signupSchema>

export function SignupForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (values: SignupValues) => {
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: values.fullName,
        email: values.email,
        officeName: values.officeName,
        password: values.password,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? 'Signup failed')
      setLoading(false)
      return
    }

    await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
      <div className="space-y-1">
        <Label>Full Name *</Label>
        <Input placeholder="Advocate Ramesh Kumar" {...register('fullName')} />
        {errors.fullName && <p className="text-xs text-red-500">{errors.fullName.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Email *</Label>
        <Input type="email" placeholder="you@example.com" {...register('email')} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Office / Firm Name <span className="text-slate-400">(optional)</span></Label>
        <Input placeholder="Your Law Chambers" {...register('officeName')} />
      </div>

      <div className="space-y-1">
        <Label>Password *</Label>
        <Input type="password" placeholder="Min. 8 characters" {...register('password')} />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <div className="space-y-1">
        <Label>Confirm Password *</Label>
        <Input type="password" placeholder="Confirm password" {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  )
}
