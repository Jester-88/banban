"use client"

import { useMemo, type ReactNode } from "react"
import { Search, X } from "lucide-react"
import { AdminCreatePoll } from "@/components/admin-create-poll"
import { PollDeadlineBadge } from "@/components/poll-deadline-badge"
import type { Poll } from "@/lib/polls"

type PollListProps = {
  polls: Poll[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  loading?: boolean
  isAdmin?: boolean
  selectedPoll?: Poll | null
  deleteBusy?: boolean
  onDeletePoll?: () => void
  onPollCreated?: (poll: Poll) => void
}

function matchesSearch(poll: Poll, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  return (
    poll.title.toLowerCase().includes(normalized) ||
    poll.tag.toLowerCase().includes(normalized)
  )
}

const POLL_LIST_SCROLL_CLASS =
  "max-h-[350px] overflow-y-auto pr-2 flex flex-col gap-3"

function PollListBox({ children }: { children: ReactNode }) {
  return <div className={POLL_LIST_SCROLL_CLASS}>{children}</div>
}

function PollCards({
  polls,
  selectedSlug,
  onSelect,
  trimmedQuery,
}: {
  polls: Poll[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
  trimmedQuery: string
}) {
  return (
    <div className="max-h-[350px] overflow-y-auto pr-2 flex flex-col gap-3">
      {trimmedQuery ? (
        <p className="shrink-0 px-1 text-[11px] text-muted-foreground">
          {polls.length}개 주제 표시 중
        </p>
      ) : null}
      {polls.map((poll) => {
        const selected = poll.slug === selectedSlug
        return (
          <button
            key={poll.id}
            type="button"
            onClick={() => onSelect(poll.slug)}
            className={`shrink-0 rounded-2xl border px-4 py-3 text-left transition-all active:scale-[0.99] ${
              selected
                ? "border-foreground/25 bg-secondary shadow-sm ring-2 ring-foreground/10"
                : "border-border bg-card/60 hover:border-foreground/15 hover:bg-card"
            }`}
          >
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-wide text-muted-foreground">
                {poll.tag}
              </span>
              <PollDeadlineBadge endsAt={poll.endsAt} />
            </div>
            <span className="line-clamp-2 text-sm font-bold leading-snug text-foreground">
              {poll.title}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function PollList({
  polls,
  selectedSlug,
  onSelect,
  searchQuery,
  onSearchChange,
  loading = false,
  isAdmin = false,
  selectedPoll = null,
  deleteBusy = false,
  onDeletePoll,
  onPollCreated,
}: PollListProps) {
  const filteredPolls = useMemo(
    () => polls.filter((poll) => matchesSearch(poll, searchQuery)),
    [polls, searchQuery],
  )

  const trimmedQuery = searchQuery.trim()

  const adminPanel =
    isAdmin && onDeletePoll && onPollCreated ? (
      <div className="space-y-2 rounded-2xl border border-border bg-card/40 p-3">
        <p className="px-1 text-[11px] font-bold tracking-wide text-muted-foreground">
          주제 관리
        </p>

        <button
          type="button"
          onClick={() => onDeletePoll()}
          disabled={deleteBusy || !selectedPoll}
          className="w-full rounded-xl border-2 border-rose-500 bg-rose-500/20 px-4 py-3 text-sm font-bold text-rose-300 transition-colors hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:border-rose-500/30 disabled:bg-rose-500/5 disabled:text-rose-500/40"
        >
          {deleteBusy
            ? "삭제 중..."
            : selectedPoll
              ? `투표 삭제 · ${selectedPoll.title}`
              : "투표 삭제 (주제를 먼저 선택하세요)"}
        </button>

        <AdminCreatePoll onCreated={onPollCreated} />
      </div>
    ) : null

  if (loading) {
    return (
      <div className="min-h-0 space-y-3">
        <PollSearchInput
          value={searchQuery}
          onChange={onSearchChange}
          disabled
        />
        <PollListBox>
          <p className="text-center text-sm text-muted-foreground">
            투표 목록을 불러오는 중...
          </p>
        </PollListBox>
        {adminPanel}
      </div>
    )
  }

  if (polls.length === 0) {
    return (
      <div className="min-h-0 space-y-3">
        <PollSearchInput
          value={searchQuery}
          onChange={onSearchChange}
          disabled
        />
        <PollListBox>
          <p className="text-center text-sm text-muted-foreground">
            등록된 투표 주제가 없습니다.
          </p>
        </PollListBox>
        {adminPanel}
      </div>
    )
  }

  return (
    <div className="min-h-0 space-y-3">
      <PollSearchInput value={searchQuery} onChange={onSearchChange} />

      {filteredPolls.length === 0 ? (
        <PollListBox>
          <div className="text-center text-sm text-muted-foreground">
            <p>&quot;{trimmedQuery}&quot;에 맞는 주제가 없습니다.</p>
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="mt-2 text-xs font-semibold text-foreground/80 underline-offset-2 hover:underline"
            >
              검색어 지우기
            </button>
          </div>
        </PollListBox>
      ) : (
        <PollCards
          polls={filteredPolls}
          selectedSlug={selectedSlug}
          onSelect={onSelect}
          trimmedQuery={trimmedQuery}
        />
      )}

      {adminPanel}
    </div>
  )
}

type PollSearchInputProps = {
  value: string
  onChange: (query: string) => void
  disabled?: boolean
}

function PollSearchInput({
  value,
  onChange,
  disabled = false,
}: PollSearchInputProps) {
  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="제목 또는 태그로 검색"
        disabled={disabled}
        className="w-full rounded-2xl border border-border bg-card/60 py-3 pl-10 pr-10 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-foreground/20 focus:bg-card focus:ring-2 focus:ring-foreground/10 disabled:cursor-not-allowed disabled:opacity-60"
        aria-label="투표 주제 검색"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange("")}
          disabled={disabled}
          className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none"
          aria-label="검색어 지우기"
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  )
}
