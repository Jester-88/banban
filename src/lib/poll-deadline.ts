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

  const today = toKstDateString(new Date())
  const endDate = toKstDateString(new Date(endsAt))
  const daysLeft = Math.round(
    (new Date(`${endDate}T00:00:00`).getTime() -
      new Date(`${today}T00:00:00`).getTime()) /
      86_400_000,
  )

  if (daysLeft < 0) {
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

export function dateInputToEndsAt(date: string): string {
  return `${date}T23:59:59+09:00`
}

export function defaultPollEndDateInput(): string {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return toKstDateString(date)
}

export function minPollEndDateInput(): string {
  return toKstDateString(new Date())
}
