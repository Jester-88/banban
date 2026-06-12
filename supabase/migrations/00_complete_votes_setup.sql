-- ============================================================
-- 반반(BANBAN) votes 테이블 완전 설정
-- Supabase Dashboard → SQL Editor → New query → 전체 붙여넣기 → Run
-- ============================================================

-- 1) 테이블이 없으면 생성
create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  question_slug text not null,
  choice text not null check (choice in ('agree', 'disagree')),
  created_at timestamptz not null default now()
);

-- 2) 누락된 컬럼 추가 (에러 원인: region, user_id)
alter table public.votes
  add column if not exists region text;

alter table public.votes
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 3) region 값 검증
alter table public.votes
  drop constraint if exists votes_region_check;

alter table public.votes
  add constraint votes_region_check check (
    region is null or region in (
      'seoul', 'busan', 'daegu', 'incheon', 'gwangju', 'daejeon', 'ulsan',
      'sejong', 'gyeonggi', 'gangwon', 'chungbuk', 'chungnam', 'jeonbuk',
      'jeonnam', 'gyeongbuk', 'gyeongnam', 'jeju'
    )
  );

-- 4) 인덱스
create index if not exists votes_question_slug_idx
  on public.votes (question_slug);

create index if not exists votes_question_slug_choice_idx
  on public.votes (question_slug, choice);

create index if not exists votes_question_slug_region_idx
  on public.votes (question_slug, region);

drop index if exists votes_user_question_unique;

create unique index votes_user_question_unique
  on public.votes (user_id, question_slug)
  where user_id is not null;

-- 5) RLS 활성화
alter table public.votes enable row level security;

-- 6) 정책 (기존 정책 제거 후 재생성)
drop policy if exists "Anyone can insert votes" on public.votes;
drop policy if exists "Authenticated users insert own vote" on public.votes;
drop policy if exists "Authenticated users insert own vote once" on public.votes;
drop policy if exists "Anyone can read votes" on public.votes;

-- 누구나 집계 조회 가능
create policy "Anyone can read votes"
  on public.votes
  for select
  to anon, authenticated
  using (true);

-- 로그인 유저만 본인 user_id로 1회 INSERT
create policy "Authenticated users insert own vote once"
  on public.votes
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and user_id is not null
    and not exists (
      select 1
      from public.votes as existing
      where existing.user_id = auth.uid()
        and existing.question_slug = votes.question_slug
    )
  );

-- 7) 확인용 (실행 후 Table Editor에서 컬럼 확인)
-- select column_name, data_type
-- from information_schema.columns
-- where table_schema = 'public' and table_name = 'votes'
-- order by ordinal_position;
