import { createClient } from "@/lib/supabase/client"

function getRedirectUrl() {
  return `${window.location.origin}/auth/callback`
}

/** 닉네임·프로필 사진만 요청 (이메일 scope 제외) */
export async function signInWithKakao() {
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: getRedirectUrl(),
      scopes: "profile_nickname profile_image",
      queryParams: {
        scope: "profile_nickname,profile_image",
      },
    },
  })
  if (error) throw error
}

function clearSupabaseCookies() {
  if (typeof document === "undefined") return

  const hostname = window.location.hostname

  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim()
    if (!name || !name.startsWith("sb-")) continue

    const expire = "expires=Thu, 01 Jan 1970 00:00:00 GMT"
    document.cookie = `${name}=; ${expire}; path=/`
    document.cookie = `${name}=; ${expire}; path=/; domain=${hostname}`
    document.cookie = `${name}=; ${expire}; path=/; domain=.${hostname}`
  }
}

/**
 * 클라이언트·서버·쿠키·스토리지를 모두 비우고 메인으로 이동.
 * onClear: React user/session 상태를 즉시 null로 초기화.
 */
export async function forceLogout(onClear?: () => void): Promise<void> {
  onClear?.()

  const supabase = createClient()

  try {
    void supabase.auth.signOut({ scope: "local" })
  } catch (error) {
    console.error("[banban] client signOut ignored:", error)
  }

  try {
    await Promise.race([
      fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      }),
      new Promise<void>((resolve) => setTimeout(resolve, 5000)),
    ])
  } catch (error) {
    console.error("[banban] server signout API ignored:", error)
  }

  try {
    clearSupabaseCookies()
  } catch (error) {
    console.error("[banban] cookie clear ignored:", error)
  }

  try {
    localStorage.clear()
  } catch (error) {
    console.error("[banban] localStorage.clear ignored:", error)
  }

  try {
    sessionStorage.clear()
  } catch (error) {
    console.error("[banban] sessionStorage.clear ignored:", error)
  }

  window.location.href = "/"
}
