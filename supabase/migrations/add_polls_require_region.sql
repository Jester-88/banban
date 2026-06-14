-- polls 지역 선택 필수 여부
alter table public.polls
  add column if not exists require_region boolean not null default true;
