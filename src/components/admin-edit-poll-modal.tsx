"use client"

import { useEffect, useState } from "react"
import { Pencil, X } from "lucide-react"
import { DEFAULT_POLL_TAG } from "@/lib/banban-data"
import { endsAtToDateInput } from "@/lib/poll-deadline"
import {
  DEFAULT_OPTION_A_LABEL,
  DEFAULT_OPTION_B_LABEL,
} from "@/lib/poll-options"
import { updatePoll, type Poll } from "@/lib/polls"

type AdminEditPollModalProps = {
  poll: Poll | null
  onClose: () => void
  onUpdated: (poll: Poll) => void
}

export function AdminEditPollModal({
  poll,
  onClose,
  onUpdated,
}: AdminEditPollModalProps) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [tag, setTag] = useState(DEFAULT_POLL_TAG)
  const [endsAtDate, setEndsAtDate] = useState("")
  const [requireRegion, setRequireRegion] = useState(true)
  const [optionALabel, setOptionALabel] = useState(DEFAULT_OPTION_A_LABEL)
  const [optionBLabel, setOptionBLabel] = useState(DEFAULT_OPTION_B_LABEL)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!poll) {
      setOpen(false)
      return
    }

    setTitle(poll.title)
    setTag(poll.tag)
    setEndsAtDate(endsAtToDateInput(poll.endsAt))
    setRequireRegion(poll.requireRegion)
    setOptionALabel(poll.optionALabel)
    setOptionBLabel(poll.optionBLabel)
    setError(null)
    setBusy(false)
    requestAnimationFrame(() => setOpen(true))
  }, [poll])

  useEffect(() => {
    if (!poll) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) handleClose()
    }

    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [poll, busy])

  function handleClose() {
    if (busy) return
    setOpen(false)
    window.setTimeout(() => onClose(), 200)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!poll || busy) return

    const trimmed = title.trim()
    if (trimmed.length < 2) {
      setError("투표 주제를 2자 이상 입력해 주세요.")
      return
    }

    if (!endsAtDate) {
      setError("마감일을 선택해 주세요.")
      return
    }

    setBusy(true)
    setError(null)

    try {
      const updated = await updatePoll({
        id: poll.id,
        title: trimmed,
        tag: tag.trim() || DEFAULT_POLL_TAG,
        endsAt: endsAtDate,
        requireRegion,
        optionALabel: optionALabel.trim() || DEFAULT_OPTION_A_LABEL,
        optionBLabel: optionBLabel.trim() || DEFAULT_OPTION_B_LABEL,
      })
      setOpen(false)
      window.setTimeout(() => {
        onUpdated(updated)
        onClose()
      }, 200)
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "투표 주제 수정에 실패했습니다.",
      )
      setBusy(false)
    }
  }

  if (!poll) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-poll-modal-title"
    >
      <button
        type="button"
        aria-label="닫기"
        disabled={busy}
        className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-200 disabled:cursor-not-allowed ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className={`relative z-10 w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-2xl transition-all duration-200 ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "translate-y-2 scale-[0.98] opacity-0"
        }`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold tracking-widest text-sky-400/90">
              ADMIN · 투표 수정
            </p>
            <h2
              id="edit-poll-modal-title"
              className="mt-1 text-lg font-extrabold text-foreground"
            >
              투표 정보 수정
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            aria-label="수정 창 닫기"
          >
            <X className="size-4" />
          </button>
        </div>

        <label className="mb-3 block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            투표 질문 (한글)
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-sky-500/30 focus:ring-2"
            disabled={busy}
            autoFocus
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            태그 (설명)
          </span>
          <input
            type="text"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder={DEFAULT_POLL_TAG}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-sky-500/30 focus:ring-2"
            disabled={busy}
          />
        </label>

        <div className="mb-3 grid grid-cols-2 gap-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              선택지 A 문구
            </span>
            <input
              type="text"
              value={optionALabel}
              onChange={(e) => setOptionALabel(e.target.value)}
              placeholder={DEFAULT_OPTION_A_LABEL}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-sky-500/30 focus:ring-2"
              disabled={busy}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              선택지 B 문구
            </span>
            <input
              type="text"
              value={optionBLabel}
              onChange={(e) => setOptionBLabel(e.target.value)}
              placeholder={DEFAULT_OPTION_B_LABEL}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-sky-500/30 focus:ring-2"
              disabled={busy}
            />
          </label>
        </div>

        <label className="mb-3 block">
          <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
            마감일
          </span>
          <input
            type="date"
            value={endsAtDate}
            onChange={(e) => setEndsAtDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-sky-500/30 focus:ring-2 [color-scheme:dark]"
            disabled={busy}
            required
          />
          <span className="mt-1.5 block text-[11px] text-muted-foreground">
            선택한 날짜 23:59(KST)까지 투표할 수 있습니다.
          </span>
        </label>

        <label className="mb-4 flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-border bg-background px-3 py-3">
          <div>
            <span className="block text-xs font-semibold text-foreground">
              지역 선택 활성화
            </span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              끄면 투표 시 구·군 선택 없이 바로 참여합니다.
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={requireRegion}
            onClick={() => setRequireRegion((prev) => !prev)}
            disabled={busy}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              requireRegion ? "bg-sky-500" : "bg-muted-foreground/30"
            }`}
          >
            <span
              className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition-transform ${
                requireRegion ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </label>

        <p className="mb-4 rounded-xl bg-secondary/60 px-3 py-2 text-[11px] text-muted-foreground">
          슬러그: <span className="font-mono text-foreground/80">{poll.slug}</span>
          <span className="mt-1 block">
            기존 투표 기록과의 연결을 위해 슬러그는 변경되지 않습니다.
          </span>
        </p>

        {error ? (
          <p className="mb-3 text-xs text-[var(--disagree)]">{error}</p>
        ) : null}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 rounded-xl bg-sky-500 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </div>
  )
}

export function PollEditButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex shrink-0 items-center gap-1 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-[11px] font-bold text-sky-400 transition-colors hover:bg-sky-500/20 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <Pencil className="size-3.5" />
      투표 수정
    </button>
  )
}
