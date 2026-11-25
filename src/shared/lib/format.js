export function money(value) {
  const n = Number(value ?? 0)
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })
}

export function titleCase(s) {
  return String(s).toLowerCase().replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}
