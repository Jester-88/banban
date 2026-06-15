-- polls 선택지 문구 컬럼
alter table public.polls
  add column if not exists option_a_label text not null default '찬성',
  add column if not exists option_b_label text not null default '반대';
