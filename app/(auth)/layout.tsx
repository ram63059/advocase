import { Scale } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-5/12 bg-foreground flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <Scale className="text-background" size={24} />
          <span className="text-background text-xl font-semibold tracking-tight">Advocase</span>
        </div>
        <div>
          <h2 className="text-background text-4xl font-semibold leading-tight">
            Manage your cases<br />with clarity.
          </h2>
          <p className="text-background/50 mt-4 text-base leading-relaxed">
            Built for Indian advocates. Clean, fast, and modern.
          </p>
        </div>
        <p className="text-background/30 text-sm">
          Trusted by advocates across Telangana, AP, Karnataka & more.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Scale className="text-foreground" size={22} />
            <span className="text-foreground text-lg font-semibold tracking-tight">Advocase</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
