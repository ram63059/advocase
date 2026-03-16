import { LoginForm } from '@/components/auth/LoginForm'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
      <p className="text-slate-500 mt-1">Sign in to your account</p>
      <LoginForm />
      <p className="text-center text-sm text-slate-500 mt-6">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="text-indigo-600 font-medium hover:underline">
          Sign up free
        </Link>
      </p>
    </div>
  )
}
