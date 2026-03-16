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
          Trusted by advocates across Telangana, AP, Karnataka &amp; more.
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
