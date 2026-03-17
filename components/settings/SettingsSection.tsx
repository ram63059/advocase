interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  id?: string
}

export function SettingsSection({ title, description, children, id }: SettingsSectionProps) {
  return (
    <div id={id} className="bg-card rounded-xl border border-border p-6">
      <div className="mb-5 pb-4 border-b border-border">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}
