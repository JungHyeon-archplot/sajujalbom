const RESULT_PATH =
  /^\/result\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i

export function readShareId(pathname = window.location.pathname) {
  const match = pathname.match(RESULT_PATH)
  return match?.[1] || null
}
