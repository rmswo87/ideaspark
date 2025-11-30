-- 프로필 아바타 이미지 URL 컬럼 추가
-- 이미 컬럼이 있을 경우를 대비해 존재 여부를 체크하는 방식은
-- Supabase 마이그레이션 스타일에 맞게 try-catch 대신 단순 추가로 처리합니다.
-- 현재 에러 로그에 따르면 avatar_url 컬럼이 존재하지 않습니다.

alter table public.profiles
  add column if not exists avatar_url text;


