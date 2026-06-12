"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Check, X, Camera, Share2 } from "lucide-react"
import { AdminCreatePoll } from "@/components/admin-create-poll"
import { KoreaMap } from "@/components/korea-map"
import { LoginModal } from "@/components/login-modal"
import { PollList } from "@/components/poll-list"
import { RegionSelectModal } from "@/components/region-select-modal"
import { UserProfileBadge } from "@/components/user-profile-badge"
import { VoteCompletedPanel } from "@/components/vote-completed-panel"
import { isAdminUser } from "@/lib/admin"
import type { RegionId } from "@/lib/banban-data"
import { useAuth } from "@/hooks/use-auth"
import { deletePoll, fetchPolls, type Poll } from "@/lib/polls"
import {
  buildEmptyRegionStats,
  fetchVoteStats,
  submitVote,
  VoteError,
  formatVoteErrorAlert,
  type VoteChoice,
  type RegionVoteStats,
  type VoteTotals,
} from "@/lib/votes"

type Vote = VoteChoice | null

const EMPTY_TOTALS: VoteTotals = {
  total: 0,
  agreeCount: 0,
  disagreeCount: 0,
  agreeRate: 50,
  disagreeRate: 50,
}

export function BanbanMain() {
  const [polls, setPolls] = useState<Poll[]>([])
  const [pollsLoading, setPollsLoading] = useState(true)
  const [pollsError, setPollsError] = useState<string | null>(null)
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)

  const {
    user,
    profile,
    existingVote,
    hasVoted,
    loading: authLoading,
    refreshUserVote,
    signOut,
  } = useAuth(selectedSlug)

  const [vote, setVote] = useState<Vote>(null)
  const [totals, setTotals] = useState<VoteTotals>(EMPTY_TOTALS)
  const [regionStats, setRegionStats] = useState<RegionVoteStats[]>(
    buildEmptyRegionStats,
  )
  const [totalsLoading, setTotalsLoading] = useState(true)
  const [busy, setBusy] = useState<"capture" | "share" | "vote" | null>(null)
  const [voteError, setVoteError] = useState<string | null>(null)
  const [loginOpen, setLoginOpen] = useState(false)
  const [regionModalOpen, setRegionModalOpen] = useState(false)
  const [pendingChoice, setPendingChoice] = useState<VoteChoice | null>(null)
  const [selectedRegion, setSelectedRegion] = useState<RegionId | null>(null)
  const [logoutBusy, setLogoutBusy] = useState(false)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const captureRef = useRef<HTMLDivElement>(null)

  const selectedPoll = useMemo(
    () => polls.find((poll) => poll.slug === selectedSlug) ?? null,
    [polls, selectedSlug],
  )

  const isAdmin = isAdminUser(user?.id)

  const refreshStats = useCallback(async (slug: string) => {
    const stats = await fetchVoteStats(slug)
    setTotals(stats.national)
    setRegionStats(stats.regions)
    return stats
  }, [])

  const loadPolls = useCallback(async () => {
    setPollsLoading(true)
    setPollsError(null)
    try {
      const list = await fetchPolls()
      setPolls(list)
      setSelectedSlug((prev) => {
        if (prev && list.some((poll) => poll.slug === prev)) return prev
        return list[0]?.slug ?? null
      })
    } catch (e) {
      console.error("[banban] polls fetch error:", e)
      setPollsError("투표 목록을 불러오지 못했습니다.")
    } finally {
      setPollsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPolls()
  }, [loadPolls])

  useEffect(() => {
    if (existingVote) setVote(existingVote)
    else if (!user) setVote(null)
  }, [existingVote, user])

  useEffect(() => {
    if (!user && !authLoading) {
      setVote(null)
      setVoteError(null)
    }
  }, [user, authLoading])

  useEffect(() => {
    if (!selectedSlug) {
      setTotals(EMPTY_TOTALS)
      setRegionStats(buildEmptyRegionStats())
      setTotalsLoading(false)
      return
    }

    let cancelled = false

    async function loadStats() {
      setTotalsLoading(true)
      setVoteError(null)
      try {
        const stats = await fetchVoteStats(selectedSlug!)
        if (!cancelled) {
          setTotals(stats.national)
          setRegionStats(stats.regions)
        }
      } catch (e) {
        console.error("[banban] stats fetch error:", e)
        if (!cancelled) {
          setVoteError(
            "투표 결과를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.",
          )
        }
      } finally {
        if (!cancelled) setTotalsLoading(false)
      }
    }

    loadStats()
    return () => {
      cancelled = true
    }
  }, [selectedSlug])

  function handlePollCreated(poll: Poll) {
    setPolls((prev) => [poll, ...prev])
    setSelectedSlug(poll.slug)
  }

  async function handleDeletePoll() {
    if (!selectedPoll || deleteBusy) return

    setDeleteBusy(true)
    try {
      await deletePoll(selectedPoll.id)
      alert("투표 주제가 삭제되었습니다.")
      window.location.reload()
    } catch (e) {
      alert(
        e instanceof Error ? e.message : "투표 주제 삭제에 실패했습니다.",
      )
      setDeleteBusy(false)
    }
  }

  function openRegionModal(choice: VoteChoice) {
    if (!selectedSlug || busy === "vote" || hasVoted) return

    if (!user) {
      setLoginOpen(true)
      return
    }

    setVoteError(null)
    setPendingChoice(choice)
    setSelectedRegion(null)
    setRegionModalOpen(true)
  }

  function closeRegionModal() {
    if (busy === "vote") return
    setRegionModalOpen(false)
    setPendingChoice(null)
    setSelectedRegion(null)
  }

  async function handleRegionVoteSubmit() {
    if (
      !selectedSlug ||
      !pendingChoice ||
      !selectedRegion ||
      busy === "vote" ||
      hasVoted
    ) {
      return
    }

    setVoteError(null)
    setBusy("vote")

    try {
      await submitVote(selectedSlug, pendingChoice, selectedRegion)
      setVote(pendingChoice)
      await refreshStats(selectedSlug)
      await refreshUserVote()
      setRegionModalOpen(false)
      setPendingChoice(null)
      setSelectedRegion(null)
      alert("투표가 완료되었습니다")
    } catch (e) {
      console.error("[banban] vote error:", e)
      alert(formatVoteErrorAlert(e))

      if (e instanceof VoteError && e.code === "ALREADY_VOTED") {
        setVote(existingVote ?? pendingChoice)
        setVoteError(e.message)
        setRegionModalOpen(false)
        setPendingChoice(null)
        setSelectedRegion(null)
        await refreshUserVote()
      } else if (e instanceof VoteError && e.code === "NOT_AUTHENTICATED") {
        setVote(null)
        setVoteError(e.message)
        setRegionModalOpen(false)
        setPendingChoice(null)
        setSelectedRegion(null)
        setLoginOpen(true)
      } else {
        setVote(existingVote)
        const msg =
          e instanceof VoteError
            ? e.message
            : "투표 저장에 실패했습니다. 잠시 후 다시 시도해 주세요."
        setVoteError(msg)
      }
      try {
        await refreshStats(selectedSlug)
      } catch (refreshError) {
        console.error("[banban] stats refresh error:", refreshError)
        alert(formatVoteErrorAlert(refreshError))
      }
    } finally {
      setBusy(null)
    }
  }

  async function handleLogout() {
    if (logoutBusy) return
    setLogoutBusy(true)
    setVote(null)
    setVoteError(null)
    try {
      await signOut()
    } finally {
      setLogoutBusy(false)
    }
  }

  async function handleCapture() {
    if (!captureRef.current) return
    setBusy("capture")
    try {
      const { default: html2canvas } = await import("html2canvas-pro")
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: getComputedStyle(document.body).backgroundColor,
        scale: 2,
      })
      const url = canvas.toDataURL("image/png")
      const a = document.createElement("a")
      a.href = url
      a.download = "banban-result.png"
      a.click()
    } catch (e) {
      console.log("[v0] capture error:", e)
    } finally {
      setBusy(null)
    }
  }

  async function handleShare() {
    if (!selectedPoll) return
    setBusy("share")
    const shareData = {
      title: "반반 · BANBAN",
      text: `${selectedPoll.tag}: ${selectedPoll.title}\n전국 찬성 ${totals.agreeRate}% vs 반대 ${totals.disagreeRate}%`,
      url: typeof window !== "undefined" ? window.location.href : "",
    }
    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`,
        )
      }
    } catch (e) {
      console.log("[v0] share cancelled:", e)
    } finally {
      setBusy(null)
    }
  }

  const showVoteCompleted = !!user && hasVoted && existingVote !== null
  const voteDisabled =
    !selectedSlug || busy === "vote" || showVoteCompleted || totalsLoading

  return (
    <>
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-7">
        <header className="flex items-start justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <h1 className="font-mono text-2xl font-extrabold tracking-tight text-foreground">
              반반
            </h1>
            <span className="font-mono text-xs font-semibold tracking-[0.25em] text-muted-foreground">
              BANBAN
            </span>
          </div>
          <div className="flex flex-col items-end gap-2">
            {authLoading ? (
              <span className="text-[11px] text-muted-foreground">
                인증 확인 중...
              </span>
            ) : user && profile ? (
              <div className="flex items-center gap-2">
                <UserProfileBadge profile={profile} />
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  disabled={logoutBusy}
                  className="rounded-full border border-border bg-card/80 px-3 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-secondary hover:text-foreground disabled:opacity-50"
                >
                  {logoutBusy ? "로그아웃 중..." : "로그아웃"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                로그인
              </button>
            )}
            <div className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1">
              <span className="size-1.5 animate-pulse rounded-full bg-[var(--agree)]" />
              <span className="text-[11px] text-muted-foreground">
                {totalsLoading
                  ? "불러오는 중..."
                  : `${totals.total.toLocaleString()}명 참여`}
              </span>
            </div>
          </div>
        </header>

        <section className="mt-5 space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-bold text-foreground">투표 주제</p>
            <p className="text-[11px] text-muted-foreground">주제를 선택하세요</p>
          </div>

          {pollsError ? (
            <p className="text-center text-xs text-[var(--disagree)]">
              {pollsError}
            </p>
          ) : null}

          <PollList
            polls={polls}
            selectedSlug={selectedSlug}
            onSelect={setSelectedSlug}
            loading={pollsLoading}
          />

          <div className="space-y-2 rounded-2xl border border-border bg-card/40 p-3">
            <p className="px-1 text-[11px] font-bold tracking-wide text-muted-foreground">
              주제 관리
            </p>

            <button
              type="button"
              onClick={() => void handleDeletePoll()}
              disabled={deleteBusy || !selectedPoll}
              className="w-full rounded-xl border-2 border-rose-500 bg-rose-500/20 px-4 py-3 text-sm font-bold text-rose-300 transition-colors hover:bg-rose-500/30 disabled:cursor-not-allowed disabled:border-rose-500/30 disabled:bg-rose-500/5 disabled:text-rose-500/40"
            >
              {deleteBusy
                ? "삭제 중..."
                : selectedPoll
                  ? `투표 삭제 · ${selectedPoll.title}`
                  : "투표 삭제 (주제를 먼저 선택하세요)"}
            </button>

            {isAdmin ? (
              <AdminCreatePoll onCreated={handlePollCreated} />
            ) : null}
          </div>
        </section>

        <div ref={captureRef} className="rounded-3xl">
          {selectedPoll ? (
            <>
              <section className="mt-7">
                <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-[11px] font-bold tracking-wide text-foreground">
                  {selectedPoll.tag}
                </span>
                <h2 className="mt-3 text-pretty text-[26px] font-extrabold leading-snug tracking-tight text-foreground">
                  {selectedPoll.title}
                </h2>
              </section>

              {showVoteCompleted ? (
                <VoteCompletedPanel
                  userChoice={existingVote}
                  totals={totals}
                  loading={totalsLoading}
                />
              ) : (
                <section className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => openRegionModal("agree")}
                    disabled={voteDisabled}
                    aria-pressed={vote === "agree"}
                    className={`group flex h-28 flex-col items-center justify-center gap-2 rounded-3xl border-2 transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${
                      vote === "agree"
                        ? "border-transparent bg-[var(--agree)] text-[var(--agree-foreground)] shadow-lg shadow-[var(--agree)]/30"
                        : "border-border bg-card text-foreground hover:border-[var(--agree)]"
                    }`}
                  >
                    <Check
                      className={`size-8 ${vote === "agree" ? "" : "text-[var(--agree)]"}`}
                      strokeWidth={2.5}
                    />
                    <span className="text-lg font-extrabold">찬성</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openRegionModal("disagree")}
                    disabled={voteDisabled}
                    aria-pressed={vote === "disagree"}
                    className={`group flex h-28 flex-col items-center justify-center gap-2 rounded-3xl border-2 transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${
                      vote === "disagree"
                        ? "border-transparent bg-[var(--disagree)] text-[var(--disagree-foreground)] shadow-lg shadow-[var(--disagree)]/30"
                        : "border-border bg-card text-foreground hover:border-[var(--disagree)]"
                    }`}
                  >
                    <X
                      className={`size-8 ${vote === "disagree" ? "" : "text-[var(--disagree)]"}`}
                      strokeWidth={2.5}
                    />
                    <span className="text-lg font-extrabold">반대</span>
                  </button>
                </section>
              )}

              {voteError ? (
                <p className="mt-2 text-center text-xs text-[var(--disagree)]">
                  {voteError}
                </p>
              ) : null}

              <section className="mt-5">
                <div className="flex h-9 w-full overflow-hidden rounded-full border border-border">
                  <div
                    className="flex items-center justify-start bg-[var(--agree)] pl-3 text-xs font-bold text-[var(--agree-foreground)] transition-all duration-500"
                    style={{ width: `${totals.agreeRate}%` }}
                  >
                    {totalsLoading ? "—" : `${totals.agreeRate}%`}
                  </div>
                  <div
                    className="flex items-center justify-end bg-[var(--disagree)] pr-3 text-xs font-bold text-[var(--disagree-foreground)] transition-all duration-500"
                    style={{ width: `${totals.disagreeRate}%` }}
                  >
                    {totalsLoading ? "—" : `${totals.disagreeRate}%`}
                  </div>
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
                  <span>
                    전국 찬성{" "}
                    {totalsLoading
                      ? ""
                      : `(${totals.agreeCount.toLocaleString()})`}
                  </span>
                  <span>
                    전국 반대{" "}
                    {totalsLoading
                      ? ""
                      : `(${totals.disagreeCount.toLocaleString()})`}
                  </span>
                </div>
              </section>

              <section className="mt-4 rounded-3xl border border-border bg-card/60 p-3">
                <div className="mb-1 flex items-center justify-between px-1">
                  <p className="text-sm font-bold text-foreground">
                    지역별 결과
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    지역을 눌러 상세 보기
                  </p>
                </div>
                <KoreaMap regions={regionStats} loading={totalsLoading} />
              </section>
            </>
          ) : (
            <section className="mt-7 rounded-2xl border border-dashed border-border bg-card/40 px-4 py-10 text-center">
              <p className="text-sm text-muted-foreground">
                {pollsLoading
                  ? "투표 주제를 불러오는 중..."
                  : "표시할 투표 주제가 없습니다."}
              </p>
            </section>
          )}
        </div>

        <section className="mt-5 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCapture}
            disabled={busy !== null || !selectedPoll}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
          >
            <Camera className="size-4" />
            {busy === "capture" ? "저장 중..." : "결과 캡처"}
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={busy !== null || !selectedPoll}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <Share2 className="size-4" />
            {busy === "share" ? "공유 중..." : "공유하기"}
          </button>
        </section>
      </main>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
      <RegionSelectModal
        open={regionModalOpen}
        choice={pendingChoice}
        selectedRegion={selectedRegion}
        submitting={busy === "vote"}
        onSelectRegion={setSelectedRegion}
        onSubmit={() => void handleRegionVoteSubmit()}
        onClose={closeRegionModal}
      />

      <div className="fixed bottom-2 right-2 z-[100] max-w-[min(100vw-1rem,360px)] truncate px-1 text-[10px] font-mono text-red-500">
        디버그 - 현재 로그인된 유저 ID: {user?.id || "로그인 안 됨 (null)"}
      </div>
    </>
  )
}
