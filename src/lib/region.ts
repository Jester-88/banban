import { REGION_IDS, type RegionId } from "@/lib/banban-data"

const SESSION_REGION_KEY = "banban-user-region"

/** 테스트용: 세션마다 임의 지역 1개를 고정해 투표 시 함께 저장 */
export function getUserRegion(): RegionId {
  if (typeof window === "undefined") {
    return REGION_IDS[0]
  }

  const saved = sessionStorage.getItem(SESSION_REGION_KEY)
  if (saved && REGION_IDS.includes(saved as RegionId)) {
    return saved as RegionId
  }

  const picked = REGION_IDS[Math.floor(Math.random() * REGION_IDS.length)]
  sessionStorage.setItem(SESSION_REGION_KEY, picked)
  return picked
}
