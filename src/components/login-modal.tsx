"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { signInWithKakao } from "@/lib/auth"

type LoginModalProps = {
  open: boolean
  onClose: () => void
}

function KakaoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M12 3C6.48 3 2 6.58 2 10.87c0 2.77 1.84 5.2 4.62 6.58-.2.74-.72 2.55-.82 2.96-.13.55.2.54.43.39.18-.12 2.9-1.97 4.08-2.77.87.13 1.77.2 2.69.2 5.52 0 10-3.58 10-7.96C20.99 6.58 16.52 3 12 3z"
      />
    </svg>
  )
}

export function LoginModal({ open, onClose }: LoginModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [open, onClose])

  if (!open) return null

  async function handleKakaoSignIn() {
    setLoading(true)
    setError(null)
    try {
      await signInWithKakao()
    } catch (e) {
      console.error("[banban] kakao login error:", e)
      setError("카카오 로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.")
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-5"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-[340px] overflow-hidden rounded-[28px] border border-white/10 bg-[#141414] shadow-2xl shadow-black/60">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-[#FEE500]/10 blur-3xl" />

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="size-5" />
        </button>

        <div className="relative flex flex-col items-center px-7 pb-8 pt-10 text-center">
          <p className="font-mono text-[10px] font-bold tracking-[0.35em] text-white/35">
            BANBAN
          </p>
          <h2
            id="login-modal-title"
            className="mt-3 text-2xl font-extrabold leading-tight text-white"
          >
            카카오로
            <br />
            투표하기
          </h2>
          <p className="mt-3 max-w-[240px] text-sm leading-relaxed text-white/50">
            신뢰도 높은 1인 1표를 위해
            <br />
            카카오 로그인이 필요해요.
          </p>

          <button
            type="button"
            disabled={loading}
            onClick={handleKakaoSignIn}
            className="mt-8 flex h-14 w-full max-w-[280px] items-center justify-center gap-3 rounded-2xl bg-[#FEE500] px-6 text-base font-extrabold text-[#191919] shadow-lg shadow-[#FEE500]/20 transition-all hover:bg-[#f5dc00] active:scale-[0.98] disabled:opacity-60"
          >
            <KakaoIcon />
            {loading ? "연결 중..." : "카카오로 1초 만에 시작하기"}
          </button>

          {error ? (
            <p className="mt-4 text-xs text-[var(--disagree)]">{error}</p>
          ) : null}

          <p className="mt-5 max-w-[260px] text-[10px] leading-relaxed text-white/25">
            로그인 시 반반 서비스 이용약관 및 개인정보 처리에 동의하게 됩니다.
          </p>
        </div>
      </div>
    </div>
  )
}
