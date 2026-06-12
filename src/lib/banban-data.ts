export const DEFAULT_POLL_TAG = "오늘의 반반"

/** @deprecated polls 테이블 사용. 하위 호환·시드용 */
export const QUESTION_TAG = DEFAULT_POLL_TAG

/** @deprecated polls 테이블 slug 사용 */
export const TODAY_QUESTION =
  "주 4일제를 전 국민에게 적용해야 할까요?"

/** @deprecated polls 테이블 slug 사용 */
export const CURRENT_QUESTION_SLUG = "four-day-workweek-2026-06-11"

export type RegionId =
  | "seoul"
  | "busan"
  | "daegu"
  | "incheon"
  | "gwangju"
  | "daejeon"
  | "ulsan"
  | "sejong"
  | "gyeonggi"
  | "gangwon"
  | "chungbuk"
  | "chungnam"
  | "jeonbuk"
  | "jeonnam"
  | "gyeongbuk"
  | "gyeongnam"
  | "jeju"

export const REGION_NAMES: Record<RegionId, string> = {
  seoul: "서울",
  busan: "부산",
  daegu: "대구",
  incheon: "인천",
  gwangju: "광주",
  daejeon: "대전",
  ulsan: "울산",
  sejong: "세종",
  gyeonggi: "경기",
  gangwon: "강원",
  chungbuk: "충북",
  chungnam: "충남",
  jeonbuk: "전북",
  jeonnam: "전남",
  gyeongbuk: "경북",
  gyeongnam: "경남",
  jeju: "제주",
}

export const REGION_IDS = Object.keys(REGION_NAMES) as RegionId[]

/** 투표 시 지역 선택 모달에 표시할 시·도 (표시 순서) */
export const VOTE_REGION_OPTIONS: { id: RegionId; name: string }[] = [
  { id: "seoul", name: "서울" },
  { id: "gyeonggi", name: "경기" },
  { id: "incheon", name: "인천" },
  { id: "gangwon", name: "강원" },
  { id: "chungnam", name: "충남" },
  { id: "chungbuk", name: "충북" },
  { id: "daejeon", name: "대전" },
  { id: "gyeongbuk", name: "경북" },
  { id: "gyeongnam", name: "경남" },
  { id: "daegu", name: "대구" },
  { id: "busan", name: "부산" },
  { id: "ulsan", name: "울산" },
  { id: "jeonbuk", name: "전북" },
  { id: "jeonnam", name: "전남" },
  { id: "gwangju", name: "광주" },
  { id: "jeju", name: "제주" },
]

export function isRegionId(value: string): value is RegionId {
  return value in REGION_NAMES
}
