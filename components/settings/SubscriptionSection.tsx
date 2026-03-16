'use client'
import { SettingsSection } from './SettingsSection'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'

const PLAN_DETAILS = {
  free: {
    label: 'Free',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    features: ['50 cases', '20 clients', 'No team members', 'Basic features'],
  },
  basic: {
    label: 'Basic',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    features: ['500 cases', '200 clients', '2 team members', 'PDF exports', 'Email reminders'],
  },
  pro: {
    label: 'Pro',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    features: [
      'Unlimited cases',
      'Unlimited clients',
      '10 team members',
      'All exports',
      'eCourts sync',
      'Priority support',
    ],
  },
}

interface SubscriptionSectionProps {
  plan: string | null
  planExpiresAt: Date | null
}

export function SubscriptionSection({ plan, planExpiresAt }: SubscriptionSectionProps) {
  const currentPlan = (plan ?? 'free') as keyof typeof PLAN_DETAILS
  const planInfo = PLAN_DETAILS[currentPlan] ?? PLAN_DETAILS.free

  return (
    <SettingsSection
      id="subscription"
      title="Subscription"
      description="Your current plan and limits"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant="outline"
              className={`text-sm px-3 py-1 font-semibold ${planInfo.color}`}
            >
              {planInfo.label} Plan
            </Badge>
            {planExpiresAt && (
              <span className="text-xs text-slate-500">
                Expires {new Date(planExpiresAt).toLocaleDateString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric',
                })}
              </span>
            )}
          </div>

          <ul className="space-y-1.5">
            {planInfo.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {currentPlan !== 'pro' && (
          <div className="shrink-0">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              Upgrade to Pro
            </Button>
            <p className="text-xs text-slate-400 mt-1.5 text-center">Coming soon</p>
          </div>
        )}
      </div>
    </SettingsSection>
  )
}
