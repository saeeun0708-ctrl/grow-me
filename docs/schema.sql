-- 나를 키워줘 — DB 스키마 (2단계)
-- Supabase 대시보드 → SQL Editor에 붙여넣고 RUN 하세요.

create extension if not exists pgcrypto;

-- 사용자(주인) = 캐릭터 1개
create table if not exists public.users (
  id             uuid primary key default gen_random_uuid(),
  auth_id        uuid unique references auth.users(id) on delete cascade,
  nickname       text not null default '나',
  theme          text,                            -- 테마(딸기우유/블루베리/복숭아) · null이면 온보딩 필요
  share_slug     text unique not null,           -- 공유 링크용 고유 슬러그
  character_code text,                            -- 확정 캐릭터(미확정 null) · 클라가 캐시
  stage          int  not null default 1,         -- 1|2|3 · 클라가 캐시
  is_independent boolean not null default false,  -- 독립 여부
  is_unlocked    boolean not null default false,  -- 상세 언락 결제 여부
  created_at     timestamptz not null default now()
);

-- 먹이(지인 1명의 제출) = 1 row
create table if not exists public.feedbacks (
  id             uuid primary key default gen_random_uuid(),
  owner_user_id  uuid not null references public.users(id) on delete cascade,
  sender_name    text not null,
  selected_words text[] not null,                 -- 제시어 7개
  created_at     timestamptz not null default now()
);
create index if not exists feedbacks_owner_idx on public.feedbacks(owner_user_id);

-- 기존 테이블이 있으면 theme 컬럼 보강 (재실행 안전)
alter table public.users add column if not exists theme text;

-- ───────────────────────── RLS ─────────────────────────
alter table public.users     enable row level security;
alter table public.feedbacks enable row level security;

-- 본인 행만 select/insert/update (로그인 사용자)
drop policy if exists users_select_own on public.users;
drop policy if exists users_insert_own on public.users;
drop policy if exists users_update_own on public.users;
create policy users_select_own on public.users for select using (auth.uid() = auth_id);
create policy users_insert_own on public.users for insert with check (auth.uid() = auth_id);
create policy users_update_own on public.users for update using (auth.uid() = auth_id);

-- 피드백: 주인만 자기 것 읽기 (직접 insert 정책 없음 → RPC로만 작성)
drop policy if exists feedbacks_select_owner on public.feedbacks;
create policy feedbacks_select_owner on public.feedbacks for select using (
  owner_user_id in (select id from public.users where auth_id = auth.uid())
);

-- ─────────────────────── 공개 RPC ───────────────────────
-- slug로 주인 공개정보 조회 (비로그인 지인도 호출)
-- 반환 타입 변경을 위해 먼저 drop (create or replace로는 시그니처 변경 불가)
drop function if exists public.get_owner_by_slug(text);
create or replace function public.get_owner_by_slug(p_slug text)
returns table(id uuid, nickname text, theme text, character_code text, stage int, is_independent boolean)
language sql security definer set search_path = public as $$
  select id, nickname, theme, character_code, stage, is_independent
  from public.users where share_slug = p_slug limit 1;
$$;
grant execute on function public.get_owner_by_slug(text) to anon, authenticated;

-- slug로 주인의 먹이 "단어 목록만" 조회 (비로그인 공개 결과 뷰용)
-- ※ 보낸 사람 이름(sender_name)은 결제 언락 영역이므로 절대 반환하지 않는다.
--    공개 결과 화면은 이 단어들로 캐릭터/성분표만 계산하고 누가 골랐는지는 가린다.
drop function if exists public.get_feedbacks_by_slug(text);
create or replace function public.get_feedbacks_by_slug(p_slug text)
returns table(selected_words text[])
language sql security definer set search_path = public as $$
  select f.selected_words
  from public.feedbacks f
  join public.users u on u.id = f.owner_user_id
  where u.share_slug = p_slug
  order by f.created_at asc;
$$;
grant execute on function public.get_feedbacks_by_slug(text) to anon, authenticated;

-- 먹이주기 (비로그인 지인도 호출) · 형식오류는 거부 (독립한 캐릭터도 먹이는 계속 받음)
create or replace function public.submit_feedback(p_owner uuid, p_name text, p_words text[])
returns void language plpgsql security definer set search_path = public as $$
declare v_exists boolean;
begin
  select true into v_exists from public.users where id = p_owner;
  if v_exists is null then raise exception 'owner not found'; end if;
  if array_length(p_words, 1) is distinct from 7 then raise exception 'need exactly 7 words'; end if;
  insert into public.feedbacks(owner_user_id, sender_name, selected_words)
  values (p_owner, coalesce(nullif(trim(p_name), ''), '익명'), p_words);
end;
$$;
grant execute on function public.submit_feedback(uuid, text, text[]) to anon, authenticated;
