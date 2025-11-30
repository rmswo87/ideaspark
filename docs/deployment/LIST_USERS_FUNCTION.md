# 📋 사용자 목록 조회 Edge Function 배포 가이드

**작성일**: 2025년 1월 30일  
**목적**: Supabase Edge Function을 통해 사용자 목록을 안전하게 조회

---

## 📋 개요

`supabase.auth.admin.listUsers()`는 서비스 역할 키가 필요하므로 클라이언트에서 직접 호출할 수 없습니다. Edge Function을 통해 서버 사이드에서 사용자 목록을 가져옵니다.

---

## 🚀 배포 방법

### 1. Supabase CLI로 배포

```bash
# Supabase CLI 로그인 (처음 한 번만)
supabase login

# Edge Function 배포
supabase functions deploy list-users
```

### 2. 환경 변수 확인

Edge Function은 자동으로 다음 환경 변수를 사용합니다:
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: 서비스 역할 키

이들은 Supabase Dashboard에서 자동으로 설정되므로 별도 설정이 필요 없습니다.

---

## ✅ 배포 확인

배포 후 다음 URL로 테스트할 수 있습니다:

```
https://djxiousdavdwwznufpzs.supabase.co/functions/v1/list-users
```

---

## 🔒 보안

- Edge Function은 관리자 권한이 있는 사용자만 접근 가능
- `admins` 테이블에서 관리자 여부 확인
- Authorization 헤더를 통한 인증 필수

---

## 📝 사용 방법

클라이언트에서 다음과 같이 호출:

```typescript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch(`${supabaseUrl}/functions/v1/list-users`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
});

const { users } = await response.json();
```

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 1월 30일

