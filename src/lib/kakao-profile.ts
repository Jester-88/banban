import type { User } from "@supabase/supabase-js"

export type KakaoProfile = {
  nickname: string
  avatarUrl: string | null
}

function readString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim()
    }
  }
  return null
}

/** 이메일 없이도 동작. 카카오 닉네임·프로필 사진을 user_metadata / identity_data에서 안전하게 추출 */
export function getKakaoProfile(user: User | null): KakaoProfile | null {
  if (!user) return null

  const meta = user.user_metadata ?? {}
  const kakaoIdentity = user.identities?.find(
    (identity) => identity.provider === "kakao",
  )
  const identityData = (kakaoIdentity?.identity_data ?? {}) as Record<
    string,
    unknown
  >

  const nickname =
    readString(
      meta.nickname,
      meta.name,
      meta.full_name,
      meta.preferred_username,
      identityData.nickname,
      identityData.name,
      identityData.full_name,
      identityData.profile_nickname,
    ) ?? "카카오 사용자"

  const avatarUrl = readString(
    meta.avatar_url,
    meta.picture,
    meta.profile_image_url,
    meta.profile_image,
    identityData.avatar_url,
    identityData.picture,
    identityData.profile_image_url,
    identityData.profile_image,
  )

  return { nickname, avatarUrl }
}
