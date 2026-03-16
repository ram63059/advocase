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
