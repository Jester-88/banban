-- 1인 1표 강제 (중복 투표 방지)
-- Supabase SQL Editor에서 실행하세요.

-- user_id 컬럼이 없다면 먼저 추가
alter table public.votes
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 동일 유저·동일 질문 중복 행 금지 (NULL user_id는 예전 데이터용으로 허용)
drop index if exists votes_user_question_unique;
create unique index votes_user_question_unique
  on public.votes (user_id, question_slug)
  where user_id is not null;

-- 익명 INSERT 차단, 인증 유저만 본인 user_id로 1회 INSERT
drop policy if exists "Anyone can insert votes" on public.votes;
drop policy if exists "Authenticated users insert own vote" on public.votes;

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

-- 집계용 SELECT는 모두 허용
drop policy if exists "Anyone can read votes" on public.votes;

create policy "Anyone can read votes"
  on public.votes
  for select
  to anon, authenticated
  using (true);

-- (선택) 중복 데이터 정리: 아래 주석 해제 후 1회 실행
-- delete from public.votes a
-- using public.votes b
-- where a.user_id is not null
--   and a.user_id = b.user_id
--   and a.question_slug = b.question_slug
--   and a.created_at < b.created_at;
