import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { CURRENT_QUESTION_SLUG } from "@/lib/banban-data"
import { isRegionId, type RegionId } from "@/lib/banban-data"
import { VOTE_COLUMNS, VOTES_TABLE } from "@/lib/votes-schema"

const VALID_CHOICES = new Set(["agree", "disagree"])

function supabaseErrorPayload(error: {
  message: string
  code?: string
  details?: string | null
  hint?: string | null
}) {
  return {
    error: error.code ?? "SUPABASE_ERROR",
    message: error.message,
    details: error.details ?? null,
    hint: error.hint ?? null,
    table: VOTES_TABLE,
  }
}

async function createSupabase() {
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const questionSlug = searchParams.get("question_slug") ?? CURRENT_QUESTION_SLUG

  const supabase = await createSupabase()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ vote: null, hasVoted: false })
  }

  const { data, error } = await supabase
    .from(VOTES_TABLE)
    .select(VOTE_COLUMNS.choice)
    .eq(VOTE_COLUMNS.questionSlug, questionSlug)
    .eq(VOTE_COLUMNS.userId, user.id)
    .order(VOTE_COLUMNS.createdAt, { ascending: false })
    .limit(1)

  if (error) {
    return NextResponse.json(supabaseErrorPayload(error), { status: 500 })
  }

  const vote = (data?.[0]?.choice as "agree" | "disagree" | undefined) ?? null
  return NextResponse.json({ vote, hasVoted: vote !== null })
}

export async function POST(request: Request) {
  const supabase = await createSupabase()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      {
        error: "NOT_AUTHENTICATED",
        message: authError?.message ?? "로그인이 필요합니다.",
        details: authError?.code ?? null,
        hint: "카카오 로그인 후 다시 시도해 주세요.",
        table: VOTES_TABLE,
      },
      { status: 401 },
    )
  }

  let body: Record<string, string | undefined>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "INVALID_BODY", message: "잘못된 요청입니다." },
      { status: 400 },
    )
  }

  const questionSlug = body[VOTE_COLUMNS.questionSlug] ?? CURRENT_QUESTION_SLUG
  const choice = body[VOTE_COLUMNS.choice]
  const region = body[VOTE_COLUMNS.region] as RegionId | undefined

  if (!choice || !VALID_CHOICES.has(choice)) {
    return NextResponse.json(
      { error: "INVALID_CHOICE", message: "유효하지 않은 투표입니다." },
      { status: 400 },
    )
  }

  if (region && !isRegionId(region)) {
    return NextResponse.json(
      { error: "INVALID_REGION", message: "유효하지 않은 지역입니다." },
      { status: 400 },
    )
  }

  const { data: existing, error: existingError } = await supabase
    .from(VOTES_TABLE)
    .select(VOTE_COLUMNS.id)
    .eq(VOTE_COLUMNS.questionSlug, questionSlug)
    .eq(VOTE_COLUMNS.userId, user.id)
    .limit(1)

  if (existingError) {
    console.error("[banban] vote check error:", existingError)
    return NextResponse.json(supabaseErrorPayload(existingError), {
      status: 500,
    })
  }

  if (existing && existing.length > 0) {
    return NextResponse.json(
      {
        error: "ALREADY_VOTED",
        message: "이미 투표에 참여하셨습니다.",
      },
      { status: 409 },
    )
  }

  const { error: insertError } = await supabase.from(VOTES_TABLE).insert({
    [VOTE_COLUMNS.questionSlug]: questionSlug,
    [VOTE_COLUMNS.choice]: choice,
    [VOTE_COLUMNS.region]: region ?? null,
    [VOTE_COLUMNS.userId]: user.id,
  })

  if (insertError) {
    console.error("[banban] vote insert error:", insertError)
    if (insertError.code === "23505") {
      return NextResponse.json(
        {
          error: "ALREADY_VOTED",
          message: "이미 투표에 참여하셨습니다.",
          details: insertError.details,
          hint: insertError.hint,
        },
        { status: 409 },
      )
    }
    return NextResponse.json(supabaseErrorPayload(insertError), { status: 500 })
  }

  return NextResponse.json({ success: true, choice })
}
