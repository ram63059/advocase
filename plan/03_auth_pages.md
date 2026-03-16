# Stage 3: Auth Pages

## Goal
Build login, signup, and forgot-password pages using NextAuth (Credentials provider + JWT strategy).
Middleware protects all dashboard routes. Passwords are hashed with bcryptjs and stored in the `Profile` table.

---

## Files to Create
- `app/(auth)/login/page.tsx`
- `app/(auth)/signup/page.tsx`
- `app/(auth)/forgot-password/page.tsx`
- `app/(auth)/reset-password/page.tsx`
- `app/(auth)/layout.tsx`
- `app/api/auth/register/route.ts`
- `app/api/auth/forgot-password/route.ts`
- `app/api/auth/reset-password/route.ts`
- `components/auth/LoginForm.tsx`
- `components/auth/SignupForm.tsx`

> `lib/auth.ts` and `app/api/auth/[...nextauth]/route.ts` are already set up in Stage 1.

---

## Step 1: Auth Layout (`app/(auth)/layout.tsx`)

Split layout: left = brand panel (desktop), right = form.

```typescript
import { Scale } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel - brand (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1A1A2E] flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <Scale className="text-indigo-400" size={32} />
          <span className="text-white text-2xl font-semibold">Advocase</span>
        </div>
        <div>
          <h2 className="text-white text-4xl font-semibold leading-tight">
            Manage your cases<br />with clarity.
          </h2>
          <p className="text-slate-400 mt-4 text-lg">
            Built for Indian advocates. Clean, fast, and modern.
          </p>
        </div>
        <p className="text-slate-500 text-sm">
          Trusted by advocates across Telangana, AP, Karnataka & more.
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Scale className="text-indigo-600" size={28} />
            <span className="text-slate-900 text-xl font-semibold">Advocase</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
```

---

## Step 2: Login Page

### `app/(auth)/login/page.tsx`

```typescript
import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
      <p className="text-slate-500 mt-1">Sign in to your account</p>
      <LoginForm />
      <p className="text-center text-sm text-slate-500 mt-6">
        Don't have an account?{' '}
        <Link href="/signup" className="text-indigo-600 font-medium hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  )
}
```

### `components/auth/LoginForm.tsx` (Client Component)

```typescript
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

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})
type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (values: LoginValues) => {
    setLoading(true)
    const result = await signIn('credentials', {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (result?.error) {
      toast.error('Invalid email or password')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
      <div className="space-y-1">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a href="/forgot-password" className="text-xs text-indigo-600 hover:underline">
            Forgot password?
          </a>
        </div>
        <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
        {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
```

---

## Step 3: Signup Page

### `app/(auth)/signup/page.tsx`

```typescript
import { SignupForm } from '@/components/auth/SignupForm'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
      <p className="text-slate-500 mt-1">Free forever — no credit card needed</p>
      <SignupForm />
      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-indigo-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
```

### `app/api/auth/register/route.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  fullName:   z.string().min(2),
  email:      z.string().email(),
  officeName: z.string().optional(),
  password:   z.string().min(8),
})

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { fullName, email, officeName, password } = parsed.data

  const existing = await prisma.profile.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.profile.create({
    data: { fullName, email, officeName, passwordHash },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
```

### `components/auth/SignupForm.tsx` (Client Component)

```typescript
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
  fullName:        z.string().min(2, 'Name must be at least 2 characters'),
  email:           z.string().email('Invalid email'),
  officeName:      z.string().optional(),
  password:        z.string().min(8, 'Password must be at least 8 characters'),
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
    // 1. Create account
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName:   values.fullName,
        email:      values.email,
        officeName: values.officeName,
        password:   values.password,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error ?? 'Signup failed')
      setLoading(false)
      return
    }

    // 2. Auto sign in
    await signIn('credentials', {
      email:    values.email,
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
        <Input type="password" placeholder="••••••••" {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Creating account…' : 'Create Account'}
      </Button>
    </form>
  )
}
```

---

## Step 4: Forgot Password

### `app/(auth)/forgot-password/page.tsx`

```typescript
// Client form with email input
// On submit → POST /api/auth/forgot-password
// Shows success message regardless (don't leak user existence)
```

### `app/api/auth/forgot-password/route.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import crypto from 'crypto'
import { addHours } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  const { email } = await request.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const profile = await prisma.profile.findUnique({ where: { email } })
  if (!profile) {
    // Don't reveal whether email exists
    return NextResponse.json({ success: true })
  }

  const token = crypto.randomBytes(32).toString('hex')
  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      resetToken:       token,
      resetTokenExpiry: addHours(new Date(), 1),
    },
  })

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`

  await resend.emails.send({
    from:    'Advocase <noreply@advocase.in>',
    to:      email,
    subject: 'Reset your Advocase password',
    html:    `<p>Click the link below to reset your password (valid for 1 hour):</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>`,
  })

  return NextResponse.json({ success: true })
}
```

---

## Step 5: Reset Password

### `app/(auth)/reset-password/page.tsx`

```typescript
// Reads ?token from URL
// Form: New Password + Confirm Password
// On submit → POST /api/auth/reset-password with { token, password }
// Redirect to /login on success
```

### `app/api/auth/reset-password/route.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  const { token, password } = await request.json()
  if (!token || !password || password.length < 8) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const profile = await prisma.profile.findFirst({
    where: {
      resetToken:       token,
      resetTokenExpiry: { gt: new Date() },
    },
  })

  if (!profile) {
    return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: {
      passwordHash:     await bcrypt.hash(password, 12),
      resetToken:       null,
      resetTokenExpiry: null,
    },
  })

  return NextResponse.json({ success: true })
}
```

---

## Step 6: Sign Out

In Sidebar (client component) — use `signOut` from `next-auth/react`:

```typescript
'use client'
import { signOut } from 'next-auth/react'

// In sidebar user section:
<button onClick={() => signOut({ callbackUrl: '/login' })}>
  <LogOut size={16} />
  Sign out
</button>
```

---

## Step 7: Get Current User in Server Components

```typescript
// Pattern used in all server pages / layouts
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

async function getCurrentProfile() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const profile = await prisma.profile.findUnique({
    where: { id: session.user.id },
  })
  if (!profile) redirect('/login')
  return profile
}
```

---

## Step 8: Get Current User in Client Components / API Routes

```typescript
// API routes
import { auth } from '@/lib/auth'

const session = await auth()
if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
const userId = session.user.id
```

```typescript
// Client components — via TanStack Query
// hooks/useProfile.ts
'use client'
import { useQuery } from '@tanstack/react-query'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile')
      if (!res.ok) throw new Error('Failed to fetch profile')
      return res.json()
    },
  })
}
```

---

## Step 9: TypeScript Session Type Augmentation

Create `types/next-auth.d.ts` to add `id` to the session user:

```typescript
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
    }
  }
}
```

---

## Verification Checklist
- [ ] Signup creates Profile row in database with hashed password
- [ ] Signup with duplicate email returns 409 and shows toast error
- [ ] Login with valid credentials redirects to `/`
- [ ] Login with invalid credentials shows "Invalid email or password"
- [ ] Forgot password sends reset email (check Resend dashboard)
- [ ] Reset password link updates passwordHash and clears token
- [ ] Expired reset link returns error
- [ ] Sign out redirects to `/login` and clears session cookie
- [ ] Unauthenticated access to `/` redirects to `/login`
- [ ] Authenticated access to `/login` redirects to `/`
- [ ] `session.user.id` is available in server components and API routes
