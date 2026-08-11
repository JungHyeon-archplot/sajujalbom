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
