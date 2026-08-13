export function teaserText(text) {
  const raw = String(text || '')
  const paras = raw.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  if (paras.length >= 2) {
    const keep = Math.max(1, Math.ceil(paras.length / 2))
    return {
      visible: paras.slice(0, keep).join('\n\n'),
      locked: keep < paras.length,
    }
  }
  const cut = Math.max(120, Math.ceil(raw.length / 2))
  return {
    visible: raw.slice(0, cut),
    locked: raw.length > cut,
  }
}
