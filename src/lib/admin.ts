/** 관리자 Supabase auth.users.id */
export const ADMIN_ID = "69093f21-1d91-47fe-a61c-24d08cade073"

export function isAdminUser(userId: string | null | undefined): boolean {
  if (!userId) return false
  return userId === ADMIN_ID
}
