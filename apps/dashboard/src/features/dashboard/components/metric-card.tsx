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
    <div>
      <p className="nd-label">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`font-mono text-3xl tracking-[-0.07em] ${toneClass}`}>
          {value}
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--nd-text-secondary)]">
          {unit}
        </span>
      </div>
    </div>
  )
}
