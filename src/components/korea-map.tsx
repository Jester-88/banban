"use client"

import { useMemo, useState } from "react"
import {
  DEFAULT_OPTION_A_LABEL,
  DEFAULT_OPTION_B_LABEL,
} from "@/lib/poll-options"
import type { RegionId } from "@/lib/banban-data"
import type { RegionVoteStats } from "@/lib/votes"

const REGION_GRID: { id: RegionId; col: number; row: number }[] = [
  { id: "seoul", col: 2, row: 1 },
  { id: "gangwon", col: 3, row: 1 },
  { id: "incheon", col: 1, row: 2 },
  { id: "gyeonggi", col: 2, row: 2 },
  { id: "chungnam", col: 1, row: 3 },
  { id: "sejong", col: 2, row: 3 },
  { id: "chungbuk", col: 3, row: 3 },
  { id: "gyeongbuk", col: 4, row: 3 },
  { id: "daejeon", col: 2, row: 4 },
  { id: "daegu", col: 4, row: 4 },
  { id: "jeonbuk", col: 1, row: 5 },
  { id: "gyeongnam", col: 3, row: 5 },
  { id: "ulsan", col: 4, row: 5 },
  { id: "gwangju", col: 1, row: 6 },
  { id: "jeonnam", col: 2, row: 6 },
  { id: "busan", col: 4, row: 6 },
  { id: "jeju", col: 2, row: 7 },
]

type RegionStatus = "empty" | "agree" | "disagree" | "tie"

function getRegionStatus(region: RegionVoteStats): RegionStatus {
  if (region.total === 0) return "empty"
  if (region.agreeCount > region.disagreeCount) return "agree"
  if (region.agreeCount < region.disagreeCount) return "disagree"
  return "tie"
}

const STATUS_STYLES: Record<RegionStatus, string> = {
  empty:
    "bg-gray-800 text-gray-400 hover:bg-gray-700 border border-gray-700",
  agree:
    "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.6)] z-10 border border-emerald-400 font-bold",
  disagree:
    "bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.6)] z-10 border border-rose-400 font-bold",
  tie: "bg-amber-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] z-10 border border-amber-400 font-bold",
}

type KoreaMapProps = {
  regions: RegionVoteStats[]
  loading?: boolean
  optionALabel?: string
  optionBLabel?: string
}

export function KoreaMap({
  regions,
  loading = false,
  optionALabel = DEFAULT_OPTION_A_LABEL,
  optionBLabel = DEFAULT_OPTION_B_LABEL,
}: KoreaMapProps) {
  const agreeLabel = optionALabel.trim() || DEFAULT_OPTION_A_LABEL
  const disagreeLabel = optionBLabel.trim() || DEFAULT_OPTION_B_LABEL
  const [selected, setSelected] = useState<RegionId | null>("gyeongnam")

  const regionById = useMemo(
    () => new Map(regions.map((region) => [region.id, region])),
    [regions],
  )

  const active = selected ? regionById.get(selected) : null
  const activeStatus = active ? getRegionStatus(active) : null

  return (
    <div className="space-y-6">
      <div className="relative mx-auto aspect-[3/4] w-full max-w-[360px]">
        <div className="absolute inset-0 grid grid-cols-4 grid-rows-7 gap-2">
          {REGION_GRID.map((cell) => {
            const region = regionById.get(cell.id)
            if (!region) return null

            const status = getRegionStatus(region)
            const isSelected = selected === cell.id

            return (
              <button
                key={cell.id}
                type="button"
                onClick={() =>
                  setSelected((prev) => (prev === cell.id ? null : cell.id))
                }
                className={`
                  flex cursor-pointer items-center justify-center rounded-xl text-sm transition-all duration-300
                  ${STATUS_STYLES[status]}
                  ${isSelected ? "scale-110 ring-4 ring-white/50" : "scale-100"}
                `}
                style={{
                  gridColumn: cell.col,
                  gridRow: cell.row,
                }}
              >
                {region.name}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-300">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
          {agreeLabel} 우세
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
          {disagreeLabel} 우세
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
          팽팽
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-gray-700" />
          투표 없음
        </div>
      </div>

      {active ? (
        <div
          className={`korea-map-detail w-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-xl backdrop-blur-md ${activeStatus ? `korea-map-detail--${activeStatus}` : ""}`}
        >
          <div className="mb-6 flex items-end justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-bold tracking-widest text-gray-500">
                REGION DETAIL
              </p>
              <h2 className="text-3xl font-bold text-white">{active.name}</h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">참여</p>
              <p className="text-xl font-bold text-white">
                {loading ? "—" : `${active.total.toLocaleString()}명`}
              </p>
            </div>
          </div>

          {active.total === 0 ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed border-white/20 p-8">
              <p className="text-gray-500">
                아직 이 지역의 투표가 없습니다
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex h-8 w-full overflow-hidden rounded-full">
                <div
                  className="flex items-center justify-start bg-emerald-500 px-3 text-xs font-bold text-white transition-all duration-700 ease-out shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                  style={{ width: `${active.agreeRate}%` }}
                >
                  {active.agreeRate}%
                </div>
                <div
                  className="flex flex-1 items-center justify-end bg-rose-500 px-3 text-xs font-bold text-white transition-all duration-700 ease-out shadow-[0_0_12px_rgba(244,63,94,0.35)]"
                >
                  {active.disagreeRate}%
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1 rounded-xl border border-white/5 bg-white/5 p-4">
                  <p className="mb-1 text-sm text-gray-400">{agreeLabel}</p>
                  <p className="text-xl font-bold text-emerald-400">
                    {active.agreeCount.toLocaleString()}표
                  </p>
                </div>
                <div className="flex-1 rounded-xl border border-white/5 bg-white/5 p-4 text-right">
                  <p className="mb-1 text-sm text-gray-400">{disagreeLabel}</p>
                  <p className="text-xl font-bold text-rose-400">
                    {active.disagreeCount.toLocaleString()}표
                  </p>
                </div>
              </div>

              <p className="text-center text-[10px] text-white/30">
                {activeStatus === "agree"
                  ? `이 지역은 ${agreeLabel}이(가) 우세합니다`
                  : activeStatus === "disagree"
                    ? `이 지역은 ${disagreeLabel}이(가) 우세합니다`
                    : "이 지역은 의견이 팽팽합니다"}
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-[11px] text-muted-foreground">
          지도에서 지역을 선택하면 상세 결과가 표시됩니다
        </p>
      )}
    </div>
  )
}
