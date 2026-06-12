-- 이미 votes 테이블을 만든 경우, SQL Editor에서 이 스크립트만 실행하세요.

alter table public.votes
  add column if not exists region text;

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

create index if not exists votes_question_slug_region_idx
  on public.votes (question_slug, region);
