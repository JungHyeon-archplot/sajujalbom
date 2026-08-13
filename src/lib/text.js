/** 화면에 보이는 ##, **, * 같은 마크다운 기호를 제거합니다. */
export function stripMarkdown(text) {
  return String(text || '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^[-*•]\s+/gm, '· ')
    .replace(/`([^`]+)`/g, '$1')
}

/** [제목] 구간으로 나눠 보기 좋게 렌더링할 수 있게 파싱합니다. */
export function parseSajuSections(text) {
  const raw = String(text || '').trim()
  if (!raw) return []

  const chunks = raw.split(/(?=\[.+?\])/)
  return chunks
    .map((chunk) => {
      const match = chunk.match(/^\[(.+?)\]\s*([\s\S]*)$/)
      if (match) {
        return { title: match[1].trim(), body: match[2].trim() }
      }
      return { title: null, body: chunk.trim() }
    })
    .filter((section) => section.title || section.body)
}
