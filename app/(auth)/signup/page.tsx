import { SignupForm } from '@/components/auth/SignupForm'
import Link from 'next/link'

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground tracking-tight">Create your account</h1>
      <p className="text-muted-foreground mt-1 text-sm">Free forever — no credit card needed</p>
      <SignupForm />
      <p className="text-center text-sm text-muted-foreground mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-foreground font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
