-- polls 마감일 컬럼
alter table public.polls
  add column if not exists ends_at timestamptz;

create index if not exists polls_ends_at_idx on public.polls (ends_at);
