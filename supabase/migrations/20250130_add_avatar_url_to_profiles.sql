-- 프로필 아바타 이미지 URL 컬럼 추가
-- 현재 에러 로그에 따르면 avatar_url 컬럼이 존재하지 않습니다.

alter table public.profiles
  add column if not exists avatar_url text;
