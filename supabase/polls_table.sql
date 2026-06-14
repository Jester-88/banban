-- polls 테이블 (앱 기대 스키마)
-- RLS: SELECT만 anon/authenticated 허용, INSERT는 API(service_role)에서만

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  tag text default '오늘의 반반',
  created_at timestamptz not null default now(),
  ends_at timestamptz,
  require_region boolean not null default true
);

create index if not exists polls_created_at_idx on public.polls (created_at desc);

alter table public.polls enable row level security;

drop policy if exists "polls_select_public" on public.polls;
create policy "polls_select_public"
  on public.polls for select
  using (true);

-- votes.question_slug 값은 polls.slug 와 동일하게 사용
