'use client'
import { ProfileSection } from './ProfileSection'
import { BankDetailsSection } from './BankDetailsSection'
import { PasswordSection } from './PasswordSection'
import { RegisteredCourtsSection } from './RegisteredCourtsSection'
import { SubscriptionSection } from './SubscriptionSection'
import { DangerZoneSection } from './DangerZoneSection'

interface SettingsPageClientProps {
  profile: any
  courts: any[]
}

export function SettingsPageClient({ profile, courts }: SettingsPageClientProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>

      <ProfileSection profile={profile} />
      <BankDetailsSection profile={profile} />
      <PasswordSection />
      <RegisteredCourtsSection courts={courts} profileId={profile.id} />
      <SubscriptionSection plan={profile.plan} planExpiresAt={profile.planExpiresAt} />
      <DangerZoneSection profileId={profile.id} />
    </div>
  )
}
