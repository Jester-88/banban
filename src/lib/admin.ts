/** 관리자 Supabase auth.users.id */
export const ADMIN_ID = "763b0844-0398-481d-8e41-ed2b85ebf97c"

export function isAdminUser(userId: string | null | undefined): boolean {
  if (!userId) return false
  return userId === ADMIN_ID
}
