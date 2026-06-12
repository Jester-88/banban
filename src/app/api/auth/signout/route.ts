import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

function isAuthCookie(name: string) {
  return name.startsWith("sb-") || name.includes("supabase")
}

export async function POST() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )

  try {
    await supabase.auth.signOut({ scope: "global" })
  } catch (error) {
    console.error("[banban] server signOut error:", error)
  }

  const response = NextResponse.json({ success: true })

  for (const cookie of cookieStore.getAll()) {
    if (isAuthCookie(cookie.name)) {
      response.cookies.set(cookie.name, "", {
        maxAge: 0,
        expires: new Date(0),
        path: "/",
      })
    }
  }

  return response
}
