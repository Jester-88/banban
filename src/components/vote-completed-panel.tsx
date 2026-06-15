import { Check, X } from "lucide-react"
import {
  DEFAULT_OPTION_A_LABEL,
  DEFAULT_OPTION_B_LABEL,
} from "@/lib/poll-options"
import type { VoteChoice, VoteTotals } from "@/lib/votes"

type VoteCompletedPanelProps = {
  userChoice: VoteChoice
  totals: VoteTotals
  loading?: boolean
  optionALabel?: string
  optionBLabel?: string
}
export function VoteCompletedPanel({
  userChoice,
  totals,
  loading = false,
  optionALabel = DEFAULT_OPTION_A_LABEL,
  optionBLabel = DEFAULT_OPTION_B_LABEL,
}: VoteCompletedPanelProps) {
  const isAgree = userChoice === "agree"
  const agreeLabel = optionALabel.trim() || DEFAULT_OPTION_A_LABEL
  const disagreeLabel = optionBLabel.trim() || DEFAULT_OPTION_B_LABEL
  return (
    <section className="mt-6 rounded-3xl border border-border bg-card p-5">
      <p className="text-center text-sm font-bold text-foreground">
        이미 투표에 참여하셨습니다
      </p>
      <p className="mt-1 text-center text-[11px] text-muted-foreground">
        1인 1표만 가능해요. 아래는 현재까지의 전국 결과입니다.
      </p>

      <div
        className={`mt-4 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 ${
          isAgree
            ? "bg-[var(--agree)]/15 text-[var(--agree)]"
            : "bg-[var(--disagree)]/15 text-[var(--disagree)]"
        }`}
      >
        {isAgree ? (
          <Check className="size-5" strokeWidth={2.5} />
        ) : (
          <X className="size-5" strokeWidth={2.5} />
        )}
        <span className="text-base font-extrabold">
          내 투표: {isAgree ? agreeLabel : disagreeLabel}
        </span>      </div>

      <div className="mt-4">
        <div className="flex h-9 w-full overflow-hidden rounded-full border border-border">
          <div
            className="flex items-center justify-start bg-[var(--agree)] pl-3 text-xs font-bold text-[var(--agree-foreground)] transition-all duration-500"
            style={{ width: `${totals.agreeRate}%` }}
          >
            {loading ? "—" : `${totals.agreeRate}%`}
          </div>
          <div
            className="flex items-center justify-end bg-[var(--disagree)] pr-3 text-xs font-bold text-[var(--disagree-foreground)] transition-all duration-500"
            style={{ width: `${totals.disagreeRate}%` }}
          >
            {loading ? "—" : `${totals.disagreeRate}%`}
          </div>
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-muted-foreground">
          <span>
            전국 {agreeLabel}{" "}
            {loading ? "" : `(${totals.agreeCount.toLocaleString()})`}
          </span>
          <span>
            전국 {disagreeLabel}{" "}
            {loading ? "" : `(${totals.disagreeCount.toLocaleString()})`}
          </span>        </div>
      </div>
    </section>
  )
}
