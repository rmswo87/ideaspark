# Supabase 마이그레이션 파일

이 폴더에는 Supabase 데이터베이스 스키마 변경을 위한 마이그레이션 파일들이 포함되어 있습니다.

## ⚠️ 중요 사항

**이 파일들은 이미 Supabase 데이터베이스에 적용되었습니다.**

- 마이그레이션 파일은 **버전 관리 및 롤백 목적**으로 보관됩니다
- 새로운 환경에 데이터베이스를 구축할 때 순서대로 실행해야 합니다
- 기존 프로덕션 데이터베이스에는 **절대 다시 실행하지 마세요**

## 마이그레이션 실행 순서

1. `20250128_create_proposals_table.sql` - 제안서 테이블 생성
2. `20250129_create_contact_inquiries_table.sql` - 문의 테이블 생성
3. `20250129_fix_contact_inquiries_rls.sql` - 문의 RLS 정책 수정
4. `20250129_fix_profiles_rls.sql` - 프로필 RLS 정책 수정
5. `20250130_add_avatar_url_to_profiles.sql` - 프로필 아바타 URL 추가
6. `20250130_set_default_is_public_true.sql` - 프로필 기본 공개 설정
7. `20250130_setup_storage_policies.sql` - Storage 정책 설정

## 새 환경 구축 시

Supabase 대시보드 → SQL Editor에서 위 순서대로 실행하세요.

## 참고

- 마이그레이션 파일명은 `YYYYMMDD_description.sql` 형식을 따릅니다
- 각 마이그레이션은 **한 번만 실행**되어야 합니다
- 프로덕션 환경에서는 Supabase CLI를 사용하여 마이그레이션을 관리하는 것을 권장합니다

