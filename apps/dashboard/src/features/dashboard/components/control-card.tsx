import { Switch } from '#/components/ui/switch'

export function ControlCard({
  checked,
  label,
  onCheckedChange,
  value,
}: {
  checked: boolean
  label: string
  onCheckedChange: (checked: boolean) => void
  value: string
}) {
  return (
    <div className="nd-panel flex items-center justify-between gap-4 p-5">
      <div>
        <p className="nd-label">{label}</p>
        <p className="mt-2 font-mono text-sm text-(--nd-text-primary)">
          {value}
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}
