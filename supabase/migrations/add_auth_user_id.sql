-- Supabase Auth 연동: 1인 1표 제한
-- SQL Editor에서 실행하세요.

alter table public.votes
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create unique index if not exists votes_user_question_unique
  on public.votes (user_id, question_slug)
  where user_id is not null;

-- 기존 익명 INSERT 정책 제거 후 인증 사용자만 투표 가능
drop policy if exists "Anyone can insert votes" on public.votes;

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

-- 집계용 조회는 익명·인증 모두 허용 (기존 정책 유지)
drop policy if exists "Anyone can read votes" on public.votes;

create policy "Anyone can read votes"
  on public.votes
  for select
  to anon, authenticated
  using (true);
