-- ============================================================
-- 반반(BANBAN) votes 테이블 — Supabase SQL Editor에 붙여넣기
-- Dashboard → SQL Editor → New query → Run
-- ============================================================

-- ⚠️ 기존 votes 테이블·데이터를 모두 지우고 새로 만듭니다.
-- 테스트 데이터만 있다면 이 스크립트 그대로 실행하세요.
drop table if exists public.votes cascade;

-- ------------------------------------------------------------
-- 테이블: public.votes
-- ------------------------------------------------------------
create table public.votes (
  -- 투표 1건당 UUID 1개 (자동 생성)
  id            uuid        primary key default gen_random_uuid(),

  -- 오늘의 질문 구분 (예: four-day-workweek-2026-06-11)
  question_slug text        not null,

  -- 찬성 agree / 반대 disagree
  choice        text        not null
                            check (choice in ('agree', 'disagree')),

  -- 투표한 지역 (17개 시·도 코드)
  region        text        not null
                            check (region in (
                              'seoul', 'busan', 'daegu', 'incheon', 'gwangju',
                              'daejeon', 'ulsan', 'sejong', 'gyeonggi', 'gangwon',
                              'chungbuk', 'chungnam', 'jeonbuk', 'jeonnam',
                              'gyeongbuk', 'gyeongnam', 'jeju'
                            )),

  -- 카카오 로그인 유저 ID (auth.users.id) — 1인 1표 핵심
  user_id       uuid        not null
                            references auth.users (id) on delete cascade,

  -- 투표 시각
  created_at    timestamptz not null default now(),

  -- ★ 1인 1표: 같은 유저가 같은 질문에 두 번 투표 불가
  constraint votes_one_per_user_per_question
    unique (user_id, question_slug)
);

-- ------------------------------------------------------------
-- 인덱스 (집계·조회 속도)
-- ------------------------------------------------------------
create index votes_question_slug_idx
  on public.votes (question_slug);

create index votes_question_slug_choice_idx
  on public.votes (question_slug, choice);

create index votes_question_slug_region_idx
  on public.votes (question_slug, region);

create index votes_user_id_idx
  on public.votes (user_id);

-- ------------------------------------------------------------
-- RLS (Row Level Security)
-- ------------------------------------------------------------
alter table public.votes enable row level security;

-- 누구나 투표 결과 집계용 SELECT 가능
create policy "votes_select_public"
  on public.votes
  for select
  to anon, authenticated
  using (true);

-- 로그인한 유저만 INSERT, 본인 user_id만, 질문당 1회
-- (DB unique 제약 + 정책 이중 방어)
create policy "votes_insert_own_once"
  on public.votes
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and not exists (
      select 1
      from public.votes as v
      where v.user_id = auth.uid()
        and v.question_slug = votes.question_slug
    )
  );

-- ------------------------------------------------------------
-- 확인 (실행 후 Results 탭에서 컬럼 목록 확인)
-- ------------------------------------------------------------
select
  column_name,
  data_type,
  is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'votes'
order by ordinal_position;
