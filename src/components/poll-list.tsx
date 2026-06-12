"use client"

import { useMemo } from "react"
import { Search, X } from "lucide-react"
import type { Poll } from "@/lib/polls"

type PollListProps = {
  polls: Poll[]
  selectedSlug: string | null
  onSelect: (slug: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  loading?: boolean
}

function matchesSearch(poll: Poll, query: string) {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return true

  return (
    poll.title.toLowerCase().includes(normalized) ||
    poll.tag.toLowerCase().includes(normalized)
  )
}

export function PollList({
  polls,
  selectedSlug,
  onSelect,
  searchQuery,
  onSearchChange,
  loading = false,
}: PollListProps) {
  const filteredPolls = useMemo(
    () => polls.filter((poll) => matchesSearch(poll, searchQuery)),
    [polls, searchQuery],
  )

  const trimmedQuery = searchQuery.trim()

  if (loading) {
    return (
      <div className="space-y-3">
        <PollSearchInput
          value={searchQuery}
          onChange={onSearchChange}
          disabled
        />
        <div className="rounded-2xl border border-border bg-card/50 px-4 py-6 text-center text-sm text-muted-foreground">
          투표 목록을 불러오는 중...
        </div>
      </div>
    )
  }

  if (polls.length === 0) {
    return (
      <div className="space-y-3">
        <PollSearchInput
          value={searchQuery}
          onChange={onSearchChange}
          disabled
        />
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
          등록된 투표 주제가 없습니다.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <PollSearchInput value={searchQuery} onChange={onSearchChange} />

      {filteredPolls.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-4 py-6 text-center text-sm text-muted-foreground">
          <p>&quot;{trimmedQuery}&quot;에 맞는 주제가 없습니다.</p>
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="mt-2 text-xs font-semibold text-foreground/80 underline-offset-2 hover:underline"
          >
            검색어 지우기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {trimmedQuery ? (
            <p className="px-1 text-[11px] text-muted-foreground">
              {filteredPolls.length}개 주제 표시 중
            </p>
          ) : null}
          {filteredPolls.map((poll) => {
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
      )}
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
