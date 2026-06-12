import type { RegionId } from "@/lib/banban-data"
import southKoreaMap from "@svg-maps/south-korea"

/** @svg-maps/south-korea id → 앱 RegionId */
export const SVG_ID_TO_REGION: Record<string, RegionId> = {
  seoul: "seoul",
  busan: "busan",
  daegu: "daegu",
  incheon: "incheon",
  gwangju: "gwangju",
  daejeon: "daejeon",
  ulsan: "ulsan",
  sejong: "sejong",
  gyeonggi: "gyeonggi",
  gangwon: "gangwon",
  "north-chungcheong": "chungbuk",
  "south-chungcheong": "chungnam",
  "north-jeolla": "jeonbuk",
  "south-jeolla": "jeonnam",
  "north-gyeongsang": "gyeongbuk",
  "south-gyeongsang": "gyeongnam",
  jeju: "jeju",
}

export const KOREA_MAP_VIEWBOX = southKoreaMap.viewBox

export type KoreaMapPath = {
  regionId: RegionId
  svgId: string
  path: string
}

export const KOREA_MAP_PATHS: KoreaMapPath[] = southKoreaMap.locations
  .map((location) => {
    const regionId = SVG_ID_TO_REGION[location.id]
    if (!regionId) return null
    return {
      regionId,
      svgId: location.id,
      path: location.path,
    }
  })
  .filter((item): item is KoreaMapPath => item !== null)
