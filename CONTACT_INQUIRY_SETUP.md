# 문의 기능 설정 가이드

## 1. 데이터베이스 마이그레이션 적용

Supabase 대시보드에서 다음 마이그레이션 파일을 실행하세요:

**파일 경로**: `supabase/migrations/20250129_create_contact_inquiries_table.sql`

### Supabase 대시보드에서 실행 방법:

1. Supabase 대시보드 접속
2. SQL Editor 메뉴 선택
3. 마이그레이션 파일 내용 복사하여 실행
4. 또는 Supabase CLI 사용:
   ```bash
   supabase db push
   ```

## 2. 이메일 알림 설정 (선택사항)

### 방법 1: Supabase Edge Function 사용 (권장)

1. **Edge Function 배포**:
   ```bash
   cd supabase/functions/send-contact-email
   supabase functions deploy send-contact-email
   ```

2. **Resend API 키 설정** (선택사항):
   - Resend 계정 생성: https://resend.com
   - API 키 발급
   - Supabase 대시보드 > Project Settings > Edge Functions > Secrets
   - `RESEND_API_KEY` 추가

3. **Resend 도메인 설정**:
   - Resend 대시보드에서 도메인 추가 및 인증
   - Edge Function의 `from` 주소를 설정한 도메인으로 변경

### 방법 2: 간단한 방법 (이메일 없이)

현재 코드는 이메일 전송 실패해도 문의는 정상적으로 저장됩니다.
이메일 알림이 필요하지 않다면 Edge Function 배포를 건너뛰어도 됩니다.

## 3. 관리자 페이지에서 문의 확인

1. 관리자 계정으로 로그인
2. 관리자 대시보드 접속 (`/admin`)
3. "문의 관리" 탭 클릭
4. 문의 목록 확인 및 관리

## 4. 기능 확인

### 문의 제출 테스트:
1. 메인 페이지 하단의 "비즈니스 문의" 섹션에서 문의 제출
2. Supabase 대시보드에서 `contact_inquiries` 테이블 확인
3. 관리자 대시보드에서 문의 목록 확인

### 관리 기능:
- 문의 상태 변경 (대기 중 → 답변 완료 → 종료)
- 관리자 메모 추가
- 문의 삭제
- 문의 상세 보기

## 5. 문제 해결

### "Could not find the table 'public.contact_inquiries'" 에러:
- 마이그레이션 파일이 적용되지 않았습니다.
- Supabase 대시보드에서 마이그레이션을 실행하세요.

### 이메일 알림이 작동하지 않음:
- Edge Function이 배포되지 않았거나
- Resend API 키가 설정되지 않았을 수 있습니다.
- 이메일 알림은 선택사항이므로 문의 저장 기능은 정상 작동합니다.

## 6. 관리자 이메일 변경

관리자 이메일을 변경하려면:
- `supabase/functions/send-contact-email/index.ts` 파일의 `ADMIN_EMAIL` 상수 수정
- Edge Function 재배포

또는 환경 변수로 설정:
- Supabase 대시보드 > Project Settings > Edge Functions > Secrets
- `ADMIN_EMAIL` 추가
