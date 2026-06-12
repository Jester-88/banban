import type { KakaoProfile } from "@/lib/kakao-profile"

type UserProfileBadgeProps = {
  profile: KakaoProfile
}

export function UserProfileBadge({ profile }: UserProfileBadgeProps) {
  const initial = profile.nickname.slice(0, 1)

  return (
    <div className="flex items-center gap-2 rounded-full border border-border bg-card/80 py-1 pl-1 pr-3">
      {profile.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatarUrl}
          alt=""
          className="size-7 rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="flex size-7 items-center justify-center rounded-full bg-[#FEE500] text-xs font-bold text-[#191919]">
          {initial}
        </span>
      )}
      <span className="max-w-[88px] truncate text-[11px] font-semibold text-foreground">
        {profile.nickname}
      </span>
    </div>
  )
}
