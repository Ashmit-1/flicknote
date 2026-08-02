export const nowIso = () => new Date().toISOString()

export const ts = (s) => (s ? Date.parse(s) : 0)

export const newerOf = (a, b) => (ts(a.updated_at) >= ts(b.updated_at) ? a : b)

export function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const sameYear = d.getFullYear() === new Date().getFullYear()
  const opts = sameYear
    ? { month: 'short', day: 'numeric' }
    : { year: 'numeric', month: 'short', day: 'numeric' }
  return d.toLocaleDateString(undefined, opts)
}

export function mergeTasks(local, remote) {
  const byId = new Map(local.map((t) => [t.id, t]))
  for (const r of remote) {
    const l = byId.get(r.id)
    byId.set(r.id, l ? newerOf(l, r) : r)
  }
  return [...byId.values()]
}
