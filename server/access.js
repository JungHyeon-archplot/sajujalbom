/**
 * 사주 해석 잠금 비밀번호 확인 (서버 전용)
 */
export function isValidAccessPassword(input, expected) {
  const got = String(input ?? '').trim()
  const want = String(expected ?? '').trim()
  return Boolean(want) && got === want
}
