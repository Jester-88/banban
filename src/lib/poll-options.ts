export const DEFAULT_OPTION_A_LABEL = "찬성"
export const DEFAULT_OPTION_B_LABEL = "반대"

export function normalizeOptionLabel(
  value: string | null | undefined,
  fallback: string,
): string {
  const trimmed = value?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : fallback
}

export function resolveOptionLabels(input: {
  optionALabel?: string | null
  option_a_label?: string | null
  optionBLabel?: string | null
  option_b_label?: string | null
}) {
  return {
    optionALabel: normalizeOptionLabel(
      input.optionALabel ?? input.option_a_label,
      DEFAULT_OPTION_A_LABEL,
    ),
    optionBLabel: normalizeOptionLabel(
      input.optionBLabel ?? input.option_b_label,
      DEFAULT_OPTION_B_LABEL,
    ),
  }
}
