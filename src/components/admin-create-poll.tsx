"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { DEFAULT_POLL_TAG } from "@/lib/banban-data"
import { defaultPollEndDateInput, minPollEndDateInput } from "@/lib/poll-deadline"
import { createPoll } from "@/lib/polls"
import type { Poll } from "@/lib/polls"

type AdminCreatePollProps = {
  onCreated: (poll: Poll) => void
}

export function AdminCreatePoll({ onCreated }: AdminCreatePollProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [tag, setTag] = useState(DEFAULT_POLL_TAG)
  const [endsAtDate, setEndsAtDate] = useState(defaultPollEndDateInput)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (busy) return

    const trimmed = title.trim()
    if (trimmed.length < 2) {
      setError("투표 주제를 2자 이상 입력해 주세요.")
      return
    }

    if (!endsAtDate) {
      setError("마감일을 선택해 주세요.")
      return
    }

    if (endsAtDate < minPollEndDateInput()) {
      setError("마감일은 오늘 이전 날짜로 설정할 수 없습니다.")
      return
    }

    setBusy(true)
    setError(null)

    try {
      const poll = await createPoll({
        title: trimmed,
        tag: tag.trim() || DEFAULT_POLL_TAG,
        endsAt: endsAtDate,
      })
      setTitle("")
      setTag(DEFAULT_POLL_TAG)
      setEndsAtDate(defaultPollEndDateInput())
      setOpen(false)
      onCreated(poll)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "투표 주제 생성에 실패했습니다.",
      )
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400 transition-colors hover:bg-emerald-500/15"
      >
        <Plus className="size-4" />
        새 투표 주제 만들기
      </button>
    )
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4"
    >
      <p className="mb-3 text-xs font-bold tracking-widest text-emerald-400/80">
        ADMIN · 새 투표 주제
      </p>

      <label className="mb-3 block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
          투표 질문 (한글)
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 주 4일제를 전 국민에게 적용해야 할까요?"
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-emerald-500/30 focus:ring-2"
          disabled={busy}
          autoFocus
        />
      </label>

      <label className="mb-3 block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
          태그 (선택)
        </span>
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder={DEFAULT_POLL_TAG}
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-emerald-500/30 focus:ring-2"
          disabled={busy}
        />
      </label>

      <label className="mb-4 block">
        <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
          마감일
        </span>
        <input
          type="date"
          value={endsAtDate}
          onChange={(e) => setEndsAtDate(e.target.value)}
          min={minPollEndDateInput()}
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground outline-none ring-emerald-500/30 focus:ring-2 [color-scheme:dark]"
          disabled={busy}
          required
        />
        <span className="mt-1.5 block text-[11px] text-muted-foreground">
          선택한 날짜 23:59(KST)까지 투표할 수 있습니다.
        </span>
      </label>

      {error ? (
        <p className="mb-3 text-xs text-[var(--disagree)]">{error}</p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (busy) return
            setOpen(false)
            setError(null)
          }}
          disabled={busy}
          className="flex-1 rounded-xl border border-border bg-card py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "생성 중..." : "주제 생성"}
        </button>
      </div>
    </form>
  )
}
