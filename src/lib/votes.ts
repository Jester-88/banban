import {
  REGION_IDS,
  REGION_NAMES,
  isRegionId,
  type RegionId,
} from "@/lib/banban-data"
import { VOTE_COLUMNS, VOTES_TABLE } from "@/lib/votes-schema"
import { createClient } from "@/lib/supabase/client"

export type VoteChoice = "agree" | "disagree"

export type VoteTotals = {
  total: number
  agreeCount: number
  disagreeCount: number
  agreeRate: number
  disagreeRate: number
}

export type RegionVoteStats = {
  id: RegionId
  name: string
  total: number
  agreeCount: number
  disagreeCount: number
  agreeRate: number
  disagreeRate: number
}

export type VoteStats = {
  national: VoteTotals
  regions: RegionVoteStats[]
}

type VoteRow = {
  choice: VoteChoice
  region: string | null
}

export class VoteError extends Error {
  constructor(
    message: string,
    public code: "ALREADY_VOTED" | "NOT_AUTHENTICATED" | "UNKNOWN",
    public details?: string | null,
    public hint?: string | null,
    public supabaseCode?: string | null,
    public httpStatus?: number,
  ) {
    super(message)
    this.name = "VoteError"
  }
}

/** alert 팝업용 에러 문자열 */
export function formatVoteErrorAlert(error: unknown): string {
  if (error instanceof VoteError) {
    const lines = [
      "[투표 저장 실패]",
      `message: ${error.message}`,
      `table: ${VOTES_TABLE}`,
      `columns: ${VOTE_COLUMNS.questionSlug}, ${VOTE_COLUMNS.choice}, ${VOTE_COLUMNS.region}, ${VOTE_COLUMNS.userId}`,
    ]
    if (error.supabaseCode) lines.push(`code: ${error.supabaseCode}`)
    if (error.details) lines.push(`details: ${error.details}`)
    if (error.hint) lines.push(`hint: ${error.hint}`)
    if (error.httpStatus) lines.push(`httpStatus: ${error.httpStatus}`)
    return lines.join("\n")
  }

  if (error && typeof error === "object") {
    const row = error as {
      message?: string
      details?: string
      hint?: string
      code?: string
    }
    const lines = ["[투표 저장 실패]"]
    if (row.message) lines.push(`message: ${row.message}`)
    if (row.code) lines.push(`code: ${row.code}`)
    if (row.details) lines.push(`details: ${row.details}`)
    if (row.hint) lines.push(`hint: ${row.hint}`)
    return lines.join("\n")
  }

  return `[투표 저장 실패]\n${String(error)}`
}

export function computeTotals(
  agreeCount: number,
  disagreeCount: number,
): VoteTotals {
  const total = agreeCount + disagreeCount
  if (total === 0) {
    return {
      total: 0,
      agreeCount: 0,
      disagreeCount: 0,
      agreeRate: 50,
      disagreeRate: 50,
    }
  }
  const agreeRate = Math.round((agreeCount / total) * 100)
  return {
    total,
    agreeCount,
    disagreeCount,
    agreeRate,
    disagreeRate: 100 - agreeRate,
  }
}

function toRegionStats(
  id: RegionId,
  agreeCount: number,
  disagreeCount: number,
): RegionVoteStats {
  const totals = computeTotals(agreeCount, disagreeCount)
  return {
    id,
    name: REGION_NAMES[id],
    total: totals.total,
    agreeCount: totals.agreeCount,
    disagreeCount: totals.disagreeCount,
    agreeRate: totals.agreeRate,
    disagreeRate: totals.disagreeRate,
  }
}

export function buildEmptyRegionStats(): RegionVoteStats[] {
  return REGION_IDS.map((id) => toRegionStats(id, 0, 0))
}

export function buildRegionStats(rows: VoteRow[]): RegionVoteStats[] {
  const counts = new Map<RegionId, { agree: number; disagree: number }>(
    REGION_IDS.map((id) => [id, { agree: 0, disagree: 0 }]),
  )

  for (const row of rows) {
    if (!row.region || !isRegionId(row.region)) continue
    const bucket = counts.get(row.region)!
    if (row.choice === "agree") bucket.agree += 1
    else bucket.disagree += 1
  }

  return REGION_IDS.map((id) => {
    const { agree, disagree } = counts.get(id)!
    return toRegionStats(id, agree, disagree)
  })
}

export function incrementTotals(
  totals: VoteTotals,
  choice: VoteChoice,
): VoteTotals {
  return computeTotals(
    totals.agreeCount + (choice === "agree" ? 1 : 0),
    totals.disagreeCount + (choice === "disagree" ? 1 : 0),
  )
}

export function incrementRegionStats(
  regions: RegionVoteStats[],
  regionId: RegionId,
  choice: VoteChoice,
): RegionVoteStats[] {
  return regions.map((region) => {
    if (region.id !== regionId) return region
    return toRegionStats(
      region.id,
      region.agreeCount + (choice === "agree" ? 1 : 0),
      region.disagreeCount + (choice === "disagree" ? 1 : 0),
    )
  })
}

/** 서버 API로 로그인 유저의 기존 투표 조회 (1인 1표 확인) */
export async function fetchUserVote(
  questionSlug: string,
): Promise<VoteChoice | null> {
  const response = await fetch(
    `/api/votes?question_slug=${encodeURIComponent(questionSlug)}`,
    { method: "GET", credentials: "include", cache: "no-store" },
  )

  if (!response.ok) {
    throw new Error(`fetchUserVote failed: ${response.status}`)
  }

  const data = (await response.json()) as {
    vote: VoteChoice | null
    hasVoted?: boolean
  }

  return data.vote ?? null
}

type ApiVoteErrorBody = {
  error?: string
  message?: string
  details?: string | null
  hint?: string | null
}

function toVoteError(
  body: ApiVoteErrorBody,
  httpStatus: number,
  fallbackCode: VoteError["code"],
): VoteError {
  return new VoteError(
    body.message ?? body.error ?? "투표 저장에 실패했습니다.",
    fallbackCode,
    body.details ?? null,
    body.hint ?? null,
    body.error ?? null,
    httpStatus,
  )
}

/** 서버 API → Supabase insert (테이블: votes) */
export async function submitVote(
  questionSlug: string,
  choice: VoteChoice,
  region?: RegionId | null,
): Promise<void> {
  const response = await fetch("/api/votes", {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      [VOTE_COLUMNS.questionSlug]: questionSlug,
      [VOTE_COLUMNS.choice]: choice,
      ...(region ? { [VOTE_COLUMNS.region]: region } : {}),
    }),
  })

  const data = (await response.json().catch(() => ({}))) as ApiVoteErrorBody

  if (response.status === 401) {
    throw toVoteError(data, 401, "NOT_AUTHENTICATED")
  }

  if (response.status === 409 || data.error === "ALREADY_VOTED") {
    throw toVoteError(
      { ...data, message: data.message ?? "이미 투표에 참여하셨습니다." },
      409,
      "ALREADY_VOTED",
    )
  }

  if (!response.ok) {
    throw toVoteError(
      {
        ...data,
        message:
          data.message ??
          `투표 저장에 실패했습니다. (HTTP ${response.status})`,
      },
      response.status,
      "UNKNOWN",
    )
  }
}

export async function fetchVoteStats(
  questionSlug: string,
): Promise<VoteStats> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from(VOTES_TABLE)
    .select(`${VOTE_COLUMNS.choice}, ${VOTE_COLUMNS.region}`)
    .eq(VOTE_COLUMNS.questionSlug, questionSlug)

  if (error) throw error

  const rows = (data ?? []) as VoteRow[]
  let agreeCount = 0
  let disagreeCount = 0

  for (const row of rows) {
    if (row.choice === "agree") agreeCount += 1
    else disagreeCount += 1
  }

  return {
    national: computeTotals(agreeCount, disagreeCount),
    regions: buildRegionStats(rows),
  }
}

/** @deprecated fetchVoteStats 사용 */
export async function fetchVoteTotals(
  questionSlug: string,
): Promise<VoteTotals> {
  const stats = await fetchVoteStats(questionSlug)
  return stats.national
}
