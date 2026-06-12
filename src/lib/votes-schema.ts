/**
 * Supabase public.votes 테이블 스키마 (앱 ↔ DB 공통)
 *
 * | DB 컬럼         | 타입        | 앱에서 사용 |
 * |----------------|------------|------------|
 * | id             | uuid       | (자동, INSERT 안 함) |
 * | question_slug  | text       | question_slug |
 * | choice         | text       | choice ('agree' | 'disagree') |
 * | region         | text       | region (17개 시도 코드) |
 * | user_id        | uuid       | user_id (서버에서 auth.uid() 설정) |
 * | created_at     | timestamptz| (자동) |
 */
export const VOTES_TABLE = "votes" as const

export const VOTE_COLUMNS = {
  id: "id",
  questionSlug: "question_slug",
  choice: "choice",
  region: "region",
  userId: "user_id",
  createdAt: "created_at",
} as const
