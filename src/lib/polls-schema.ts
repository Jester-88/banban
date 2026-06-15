export const POLLS_TABLE = "polls"

export const POLL_COLUMNS = {
  id: "id",
  slug: "slug",
  title: "title",
  tag: "tag",
  createdAt: "created_at",
  endsAt: "ends_at",
  requireRegion: "require_region",
  optionALabel: "option_a_label",
  optionBLabel: "option_b_label",
} as const

export const POLL_SELECT_COLUMNS = [
  POLL_COLUMNS.id,
  POLL_COLUMNS.slug,
  POLL_COLUMNS.title,
  POLL_COLUMNS.tag,
  POLL_COLUMNS.createdAt,
  POLL_COLUMNS.endsAt,
  POLL_COLUMNS.requireRegion,
  POLL_COLUMNS.optionALabel,
  POLL_COLUMNS.optionBLabel,
].join(", ")
