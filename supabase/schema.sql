-- sajujalbom 권한 설계
-- Supabase SQL Editor에 통째로 붙여넣고 실행하세요. 여러 번 실행해도 안전합니다.

-- ─────────────────────────────────────────────
-- 1. 마스터 계정 판별
--    로그인 토큰의 이메일을 보고 마스터인지 판단합니다.
--    마스터를 추가하려면 아래 목록에 이메일을 넣고 다시 실행하세요.
-- ─────────────────────────────────────────────
create or replace function public.is_master()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    lower(auth.jwt() ->> 'email') in (
      'jhsimon7@dgu.ac.kr',
      'archplot100@gmail.com'
    ),
    false
  );
$$;

-- ─────────────────────────────────────────────
-- 2. 소유자 컬럼
--    saju_readings는 브라우저에서 직접 저장하므로 기본값으로 로그인 사용자를 넣습니다.
--    tarot_readings는 서버가 저장하므로 서버가 값을 직접 넣습니다.
-- ─────────────────────────────────────────────
alter table public.saju_readings
  add column if not exists user_id uuid default auth.uid()
  references auth.users(id) on delete cascade;

alter table public.tarot_readings
  add column if not exists user_id uuid
  references auth.users(id) on delete set null;

-- ─────────────────────────────────────────────
-- 3. 사주: 본인 것만, 마스터는 전부
-- ─────────────────────────────────────────────
alter table public.saju_readings enable row level security;

drop policy if exists "saju_select" on public.saju_readings;
create policy "saju_select" on public.saju_readings
  for select
  using (user_id = auth.uid() or public.is_master());

-- 로그인 사용자는 자기 것으로만, 비로그인(비밀번호 사용자)은 주인 없는 기록으로 저장됩니다.
drop policy if exists "saju_insert" on public.saju_readings;
create policy "saju_insert" on public.saju_readings
  for insert
  with check (user_id is not distinct from auth.uid());

drop policy if exists "saju_update" on public.saju_readings;
create policy "saju_update" on public.saju_readings
  for update
  using (user_id = auth.uid() or public.is_master())
  with check (user_id = auth.uid() or public.is_master());

drop policy if exists "saju_delete" on public.saju_readings;
create policy "saju_delete" on public.saju_readings
  for delete
  using (user_id = auth.uid() or public.is_master());

-- ─────────────────────────────────────────────
-- 4. 타로: 브라우저에서는 아무도 못 봅니다.
--    정책을 하나도 만들지 않아 anon/로그인 사용자 모두 차단되고,
--    서버의 service_role 키(= /api/admin)만 접근할 수 있습니다.
--    마스터 조회는 /api/admin 이 이메일을 확인한 뒤 대신 읽어 줍니다.
-- ─────────────────────────────────────────────
alter table public.tarot_readings enable row level security;

-- ─────────────────────────────────────────────
-- 5. 확인용
-- ─────────────────────────────────────────────
-- select tablename, rowsecurity from pg_tables
--   where tablename in ('saju_readings', 'tarot_readings');
-- select tablename, policyname from pg_policies
--   where tablename in ('saju_readings', 'tarot_readings');
