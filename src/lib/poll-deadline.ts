const KST_TIMEZONE = "Asia/Seoul"

function toKstDateString(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: KST_TIMEZONE })
}

export type PollDeadlineStatus = {
  isExpired: boolean
  label: string | null
  daysLeft: number | null
}

export function getPollDeadlineStatus(
  endsAt: string | null | undefined,
): PollDeadlineStatus {
  if (!endsAt) {
    return { isExpired: false, label: null, daysLeft: null }
  }

  const end = new Date(endsAt)
  if (Number.isNaN(end.getTime())) {
    return { isExpired: false, label: null, daysLeft: null }
  }

  const now = new Date()
  const isExpired = now.getTime() > end.getTime()

  const today = toKstDateString(now)
  const endDate = toKstDateString(end)
  const daysLeft = Math.round(
    (new Date(`${endDate}T00:00:00+09:00`).getTime() -
      new Date(`${today}T00:00:00+09:00`).getTime()) /
      86_400_000,
  )

  if (isExpired) {
    return { isExpired: true, label: "마감됨", daysLeft }
  }

  if (daysLeft === 0) {
    return { isExpired: false, label: "마감까지 D-Day", daysLeft: 0 }
  }

  return {
    isExpired: false,
    label: `마감까지 D-${daysLeft}`,
    daysLeft,
  }
}

/** date input(YYYY-MM-DD) → polls.ends_at timestamptz (해당일 23:59:59 KST) */
export function dateInputToEndsAt(date: string): string {
  return new Date(`${date}T23:59:59+09:00`).toISOString()
}

export function defaultPollEndDateInput(): string {
  const today = toKstDateString(new Date())
  const [year, month, day] = today.split("-").map(Number)
  const future = new Date(Date.UTC(year, month - 1, day + 7))
  return toKstDateString(future)
}

export function minPollEndDateInput(): string {
  return toKstDateString(new Date())
}

export function isValidEndsAtIso(value: string): boolean {
  const parsed = new Date(value)
  return !Number.isNaN(parsed.getTime())
}
