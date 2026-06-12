import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { isAdminUser } from "@/lib/admin"
import { DEFAULT_POLL_TAG } from "@/lib/banban-data"
import { POLL_COLUMNS, POLLS_TABLE } from "@/lib/polls-schema"
import { generateSlugFromTitle, withUniqueSlugSuffix } from "@/lib/slug"
import { createAdminClient } from "@/lib/supabase/admin"

async function createSessionSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
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
}

export async function POST(request: Request) {
  const supabase = await createSessionSupabase()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: "NOT_AUTHENTICATED", message: "로그인이 필요합니다." },
      { status: 401 },
    )
  }

  if (!isAdminUser(user.id)) {
    return NextResponse.json(
      { error: "FORBIDDEN", message: "관리자만 투표 주제를 생성할 수 있습니다." },
      { status: 403 },
    )
  }

  let body: { title?: string; tag?: string }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "INVALID_BODY", message: "잘못된 요청입니다." },
      { status: 400 },
    )
  }

  const title = body.title?.trim()
  if (!title || title.length < 2) {
    return NextResponse.json(
      { error: "INVALID_TITLE", message: "투표 주제를 2자 이상 입력해 주세요." },
      { status: 400 },
    )
  }

  const tag = body.tag?.trim() || DEFAULT_POLL_TAG
  const baseSlug = generateSlugFromTitle(title)

  let admin
  try {
    admin = createAdminClient()
  } catch (e) {
    console.error("[banban] admin client error:", e)
    return NextResponse.json(
      {
        error: "SERVER_CONFIG",
        message: "서버 설정(SUPABASE_SERVICE_ROLE_KEY)이 필요합니다.",
      },
      { status: 500 },
    )
  }

  let inserted: Record<string, unknown> | null = null
  let lastError: { message: string; code?: string } | null = null

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const slug = withUniqueSlugSuffix(baseSlug, attempt)
    const { data, error } = await admin
      .from(POLLS_TABLE)
      .insert({
        [POLL_COLUMNS.slug]: slug,
        [POLL_COLUMNS.title]: title,
        [POLL_COLUMNS.tag]: tag,
      })
      .select(
        `${POLL_COLUMNS.id}, ${POLL_COLUMNS.slug}, ${POLL_COLUMNS.title}, ${POLL_COLUMNS.tag}, ${POLL_COLUMNS.createdAt}`,
      )
      .single()

    if (!error && data) {
      inserted = data as Record<string, unknown>
      break
    }

    lastError = error
    if (error?.code !== "23505") break
  }

  if (!inserted) {
    console.error("[banban] poll insert error:", lastError)
    return NextResponse.json(
      {
        error: "INSERT_FAILED",
        message: lastError?.message ?? "투표 주제 저장에 실패했습니다.",
        code: lastError?.code ?? null,
      },
      { status: 500 },
    )
  }

  return NextResponse.json({ poll: inserted }, { status: 201 })
}
