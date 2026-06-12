"use client"

import { useEffect } from "react"
import { Check, MapPin, X } from "lucide-react"
import { VOTE_REGION_OPTIONS } from "@/lib/banban-data"
import type { RegionId } from "@/lib/banban-data"
import type { VoteChoice } from "@/lib/votes"

type RegionSelectModalProps = {
  open: boolean
  choice: VoteChoice | null
  selectedRegion: RegionId | null
  submitting: boolean
  onSelectRegion: (region: RegionId) => void
  onSubmit: () => void
  onClose: () => void
}

export function RegionSelectModal({
  open,
  choice,
  selectedRegion,
  submitting,
  onSelectRegion,
  onSubmit,
  onClose,
}: RegionSelectModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, onClose, submitting])

  if (!open || !choice) return null

  const choiceLabel = choice === "agree" ? "찬성" : "반대"
  const choiceColor =
    choice === "agree" ? "var(--agree)" : "var(--disagree)"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="region-modal-title"
    >
      <button
        type="button"
        aria-label="닫기"
        disabled={submitting}
        className="absolute inset-0 bg-black/70 backdrop-blur-md disabled:cursor-not-allowed"
        onClick={onClose}
      />

      <div className="relative flex max-h-[min(92dvh,720px)] w-full max-w-[400px] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#141414] shadow-2xl shadow-black/60">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-40 w-64 -translate-x-1/2 rounded-full bg-white/5 blur-3xl" />

        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40"
        >
          <X className="size-5" />
        </button>

        <div className="relative flex shrink-0 flex-col items-center px-6 pb-4 pt-8 text-center">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/5">
            <MapPin className="size-5 text-white/70" strokeWidth={2.2} />
          </div>
          <h2
            id="region-modal-title"
            className="mt-4 text-xl font-extrabold leading-snug text-white"
          >
            당신의 지역을 선택해 주세요
          </h2>
          <p className="mt-2 text-sm text-white/45">
            선택한{" "}
            <span
              className="font-bold"
              style={{ color: choiceColor }}
            >
              {choiceLabel}
            </span>
            의 지역을 알려주세요
          </p>
        </div>

        <div className="relative min-h-0 flex-1 overflow-y-auto px-5 pb-2">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {VOTE_REGION_OPTIONS.map(({ id, name }) => {
              const selected = selectedRegion === id
              return (
                <button
                  key={id}
                  type="button"
                  disabled={submitting}
                  onClick={() => onSelectRegion(id)}
                  className={`relative flex h-11 items-center justify-center rounded-xl border text-sm font-semibold transition-all active:scale-[0.97] disabled:opacity-50 ${
                    selected
                      ? "border-transparent text-white shadow-md"
                      : "border-white/10 bg-white/5 text-white/80 hover:border-white/25 hover:bg-white/10"
                  }`}
                  style={
                    selected
                      ? {
                          backgroundColor: choiceColor,
                          boxShadow: `0 8px 24px color-mix(in srgb, ${choiceColor} 35%, transparent)`,
                        }
                      : undefined
                  }
                >
                  {selected ? (
                    <Check className="absolute left-2 size-3.5 opacity-90" />
                  ) : null}
                  {name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="relative shrink-0 border-t border-white/8 px-5 py-5">
          <button
            type="button"
            disabled={!selectedRegion || submitting}
            onClick={onSubmit}
            className="flex h-12 w-full items-center justify-center rounded-2xl text-base font-extrabold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              backgroundColor: selectedRegion ? choiceColor : "rgba(255,255,255,0.1)",
            }}
          >
            {submitting ? "투표 저장 중..." : "투표 제출하기"}
          </button>
          {!selectedRegion ? (
            <p className="mt-2 text-center text-[11px] text-white/35">
              지역을 선택하면 제출할 수 있어요
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
