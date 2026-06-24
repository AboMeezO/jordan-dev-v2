const _compactFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
  notation: 'compact',
})

export function compactNumber(value: number) {
  return _compactFormatter.format(value)
}
