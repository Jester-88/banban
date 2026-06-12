/** 한글 제목 → 영문·숫자 slug (votes.question_slug / polls.slug 와 동일 형식) */
export function generateSlugFromTitle(title: string): string {
  const trimmed = title.trim()
  const date = new Date().toISOString().slice(0, 10)

  const latin = trimmed
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48)

  if (latin.length >= 2) {
    return `${latin}-${date}`
  }

  const hash = Array.from(trimmed).reduce(
    (acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0,
    0,
  )
  return `topic-${date}-${hash.toString(36)}`
}

export function withUniqueSlugSuffix(base: string, attempt: number): string {
  if (attempt <= 0) return base
  return `${base}-${attempt}`
}
