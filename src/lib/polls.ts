import { DEFAULT_POLL_TAG } from "@/lib/banban-data"
import { dateInputToEndsAt, isValidEndsAtIso } from "@/lib/poll-deadline"
import { POLL_COLUMNS, POLLS_TABLE } from "@/lib/polls-schema"
import { createClient } from "@/lib/supabase/client"

export type Poll = {
  id: string
  slug: string
  title: string
  tag: string
  createdAt: string
  endsAt: string | null
}

export type CreatePollInput = {
  title: string
  tag?: string
  /** ISO 8601 timestamptz 또는 YYYY-MM-DD (KST 마감일) */
  endsAt: string
}

export const POLL_SELECT_COLUMNS = [
  POLL_COLUMNS.id,
  POLL_COLUMNS.slug,
  POLL_COLUMNS.title,
  POLL_COLUMNS.tag,
  POLL_COLUMNS.createdAt,
  POLL_COLUMNS.endsAt,
].join(", ")

type PollRow = {
  id: string
  slug: string
  title: string
  tag: string | null
  created_at?: string | null
  createdAt?: string | null
  ends_at?: string | null
  endsAt?: string | null
}

function normalizeEndsAt(value: string | null | undefined): string | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function toPoll(row: PollRow): Poll {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tag: row.tag?.trim() || DEFAULT_POLL_TAG,
    createdAt: row.created_at ?? row.createdAt ?? "",
    endsAt: normalizeEndsAt(row.ends_at ?? row.endsAt ?? null),
  }
}

export function normalizeCreateEndsAt(endsAt: string): string {
  const trimmed = endsAt.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return dateInputToEndsAt(trimmed)
  }
  if (!isValidEndsAtIso(trimmed)) {
    throw new Error("마감일 형식이 올바르지 않습니다.")
  }
  return new Date(trimmed).toISOString()
}

export async function fetchPolls(): Promise<Poll[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(POLLS_TABLE)
    .select(POLL_SELECT_COLUMNS)
    .order(POLL_COLUMNS.createdAt, { ascending: false })

  if (error) {
    console.error("[banban] fetchPolls error:", error)
    throw new Error(error.message)
  }

  return (data as PollRow[] | null)?.map(toPoll) ?? []
}

export async function createPoll(input: CreatePollInput): Promise<Poll> {
  const endsAt = normalizeCreateEndsAt(input.endsAt)

  const response = await fetch("/api/polls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      title: input.title,
      tag: input.tag,
      endsAt,
    }),
  })

  const body = (await response.json()) as {
    poll?: PollRow
    error?: string
    message?: string
  }

  if (!response.ok) {
    throw new Error(body.message ?? body.error ?? "투표 주제 생성에 실패했습니다.")
  }

  if (!body.poll) {
    throw new Error("서버 응답이 올바르지 않습니다.")
  }

  return toPoll(body.poll)
}

export async function deletePoll(id: string): Promise<void> {
  const response = await fetch("/api/polls", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ id }),
  })

  const body = (await response.json()) as {
    error?: string
    message?: string
  }

  if (!response.ok) {
    throw new Error(body.message ?? body.error ?? "투표 주제 삭제에 실패했습니다.")
  }
}
