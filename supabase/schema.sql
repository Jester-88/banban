-- 반반(BANBAN) votes 테이블
-- Supabase Dashboard → SQL Editor 에서 실행하세요.

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  question_slug text not null,
  choice text not null check (choice in ('agree', 'disagree')),
  user_id uuid references auth.users(id) on delete cascade,
  region text check (
    region is null or region in (
      'seoul', 'busan', 'daegu', 'incheon', 'gwangju', 'daejeon', 'ulsan',
      'sejong', 'gyeonggi', 'gangwon', 'chungbuk', 'chungnam', 'jeonbuk',
      'jeonnam', 'gyeongbuk', 'gyeongnam', 'jeju'
    )
  ),
  created_at timestamptz not null default now()
);

create index if not exists votes_question_slug_idx
  on public.votes (question_slug);

create index if not exists votes_question_slug_choice_idx
  on public.votes (question_slug, choice);

create index if not exists votes_question_slug_region_idx
  on public.votes (question_slug, region);

create unique index if not exists votes_user_question_unique
  on public.votes (user_id, question_slug)
  where user_id is not null;

-- 전국 집계용 함수 (선택 사항)
create or replace function public.get_vote_totals(p_question_slug text)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'total', count(*)::int,
    'agree_count', count(*) filter (where choice = 'agree')::int,
    'disagree_count', count(*) filter (where choice = 'disagree')::int
  )
  from public.votes
  where question_slug = p_question_slug;
$$;

grant execute on function public.get_vote_totals(text) to anon, authenticated;

alter table public.votes enable row level security;

create policy "Authenticated users insert own vote"
  on public.votes
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and not exists (
      select 1
      from public.votes as existing
      where existing.user_id = auth.uid()
        and existing.question_slug = votes.question_slug
    )
  );

create policy "Anyone can read votes"
  on public.votes
  for select
  to anon, authenticated
  using (true);
