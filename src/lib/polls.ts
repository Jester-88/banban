import { DEFAULT_POLL_TAG } from "@/lib/banban-data"
import { POLL_COLUMNS, POLLS_TABLE } from "@/lib/polls-schema"
import { createClient } from "@/lib/supabase/client"

export type Poll = {
  id: string
  slug: string
  title: string
  tag: string
  createdAt: string
}

type PollRow = {
  id: string
  slug: string
  title: string
  tag: string | null
  created_at: string
}

function toPoll(row: PollRow): Poll {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tag: row.tag?.trim() || DEFAULT_POLL_TAG,
    createdAt: row.created_at,
  }
}

export async function fetchPolls(): Promise<Poll[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(POLLS_TABLE)
    .select(
      `${POLL_COLUMNS.id}, ${POLL_COLUMNS.slug}, ${POLL_COLUMNS.title}, ${POLL_COLUMNS.tag}, ${POLL_COLUMNS.createdAt}`,
    )
    .order(POLL_COLUMNS.createdAt, { ascending: false })

  if (error) {
    console.error("[banban] fetchPolls error:", error)
    throw new Error(error.message)
  }

  return (data as PollRow[] | null)?.map(toPoll) ?? []
}

export async function createPoll(input: {
  title: string
  tag?: string
}): Promise<Poll> {
  const response = await fetch("/api/polls", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
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
