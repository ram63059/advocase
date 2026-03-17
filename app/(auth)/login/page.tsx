import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground tracking-tight">Welcome back</h1>
      <p className="text-muted-foreground mt-1 text-sm">Sign in to your account</p>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-foreground font-medium hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  )
}
