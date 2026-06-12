import { getPollDeadlineStatus } from "@/lib/poll-deadline"

type PollDeadlineBadgeProps = {
  endsAt: string | null | undefined
  className?: string
}

export function PollDeadlineBadge({
  endsAt,
  className = "",
}: PollDeadlineBadgeProps) {
  const status = getPollDeadlineStatus(endsAt)
  if (!status.label) return null

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${
        status.isExpired
          ? "bg-muted text-muted-foreground"
          : status.daysLeft !== null && status.daysLeft <= 1
            ? "bg-amber-500/15 text-amber-400"
            : "bg-sky-500/15 text-sky-400"
      } ${className}`}
    >
      {status.label}
    </span>
  )
}
