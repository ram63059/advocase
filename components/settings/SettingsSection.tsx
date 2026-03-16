interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  id?: string
}

export function SettingsSection({ title, description, children, id }: SettingsSectionProps) {
  return (
    <div id={id} className="bg-white rounded-lg border border-slate-200 p-6">
      <div className="mb-5 pb-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}
