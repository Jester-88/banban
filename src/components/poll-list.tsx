"use client"

import type { Poll } from "@/lib/polls"

type PollListProps = {
  polls: Poll[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
  loading?: boolean
}

export function PollList({
  polls,
  selectedSlug,
  onSelect,
  loading = false,
}: PollListProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
        투표 목록을 불러오는 중...
      </div>
    )
  }

  if (polls.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
        등록된 투표 주제가 없습니다.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {polls.map((poll) => {
        const selected = poll.slug === selectedSlug
        return (
          <button
            key={poll.id}
            type="button"
            onClick={() => onSelect(poll.slug)}
            className={`rounded-2xl border px-4 py-3 text-left transition-all active:scale-[0.99] ${
              selected
                ? "border-foreground/25 bg-secondary shadow-sm ring-2 ring-foreground/10"
                : "border-border bg-card/60 hover:border-foreground/15 hover:bg-card"
            }`}
          >
            <span className="mb-1 block text-[10px] font-bold tracking-wide text-muted-foreground">
              {poll.tag}
            </span>
            <span className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
              {poll.title}
            </span>
          </button>
        )
      })}
    </div>
  )
}
