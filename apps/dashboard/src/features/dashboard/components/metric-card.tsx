export function MetricCard({
  label,
  tone = 'default',
  unit,
  value,
}: {
  label: string
  tone?: 'default' | 'success' | 'warning'
  unit: string
  value: string
}) {
  const toneClass =
    tone === 'success'
      ? 'text-[var(--nd-success)]'
      : tone === 'warning'
        ? 'text-[var(--nd-warning)]'
        : 'text-[var(--nd-text-display)]'

  return (
    <div className="border border-[var(--nd-border)] p-4">
      <p className="nd-label">{label}</p>
      <div className="mt-4 flex items-end gap-2">
        <span className={`font-mono text-4xl tracking-[-0.07em] ${toneClass}`}>
          {value}
        </span>
        <span className="mb-1 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--nd-text-secondary)]">
          {unit}
        </span>
      </div>
    </div>
  )
}
