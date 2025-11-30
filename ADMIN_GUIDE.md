# 관리자 계정 및 관리자 페이지 사용 가이드

## 관리자 계정 생성 방법

### 방법 1: Supabase 대시보드에서 직접 생성 (권장)

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - `ideaspark` 프로젝트 선택

2. **사용자 생성**
   - 왼쪽 메뉴: `Authentication` → `Users`
   - `Add user` 버튼 클릭
   - 다음 정보 입력:
     - **Email**: 원하는 관리자 이메일 (예: `admin@ideaspark.com`)
     - **Password**: 안전한 비밀번호
     - **Auto Confirm User**: ✅ 체크 (이메일 확인 없이 바로 사용 가능)
   - `Create user` 클릭

3. **관리자 권한 부여**
   - SQL Editor 열기 (왼쪽 메뉴)
   - 다음 SQL 실행 (이메일을 위에서 생성한 이메일로 변경):

```sql
-- 사용자 ID 조회
SELECT id, email FROM auth.users WHERE email = 'admin@ideaspark.com';

-- 위에서 조회한 ID를 사용하여 관리자 권한 부여
-- (예시: ID가 '12345678-1234-1234-1234-123456789abc'인 경우)
INSERT INTO admins (user_id, role) 
VALUES ('12345678-1234-1234-1234-123456789abc', 'admin');
```

### 방법 2: 기존 사용자를 관리자로 승격

1. **기존 계정으로 로그인**
   - 웹사이트에서 회원가입/로그인

2. **Supabase SQL Editor에서 관리자 권한 부여**
   ```sql
   -- 사용자 ID 조회
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
   
   -- 관리자 권한 부여
   INSERT INTO admins (user_id, role) 
   VALUES ('your-user-id-here', 'admin');
   ```

## 관리자 페이지 접속 방법

1. **로그인**
   - 웹사이트에서 관리자 계정으로 로그인

2. **관리자 페이지 접속**
   - 방법 A: 헤더의 "관리자" 버튼 클릭
   - 방법 B: 직접 URL 접속: `http://localhost:5173/admin`

3. **접근 권한 확인**
   - 관리자 권한이 있는 경우: 관리자 대시보드 표시
   - 관리자 권한이 없는 경우: "접근 권한이 없습니다" 메시지 표시

## 관리자 페이지 기능

### 1. 개요 (Overview)
- 총 사용자 수
- 총 아이디어 수
- 총 게시글 수
- 총 댓글 수

### 2. 사용자 관리
- 모든 사용자 목록 조회
- 사용자를 관리자로 지정/해제
- 사용자 정보 확인

### 3. 아이디어 관리
- 모든 아이디어 조회
- 아이디어 삭제
- 아이디어 상세 정보 확인

### 4. 게시글 관리
- 모든 게시글 조회
- 게시글 삭제
- 게시글 상세 정보 확인

## 빠른 시작 (Quick Start)

### 1단계: 관리자 계정 생성
```sql
-- Supabase SQL Editor에서 실행
-- 1. 사용자 생성 (Supabase 대시보드에서)
-- 2. 관리자 권한 부여
INSERT INTO admins (user_id, role) 
SELECT id, 'admin' 
FROM auth.users 
WHERE email = 'admin@ideaspark.com';
```

### 2단계: 로그인 및 접속
1. 웹사이트에서 관리자 계정으로 로그인
2. 헤더의 "관리자" 버튼 클릭
3. 관리자 대시보드 확인

## 문제 해결

### "접근 권한이 없습니다" 메시지가 표시되는 경우
- 관리자 권한이 제대로 부여되었는지 확인
- SQL Editor에서 다음 쿼리로 확인:
  ```sql
  SELECT a.*, u.email 
  FROM admins a 
  JOIN auth.users u ON a.user_id = u.id;
  ```

### 관리자 버튼이 보이지 않는 경우
- 로그인 상태 확인
- 관리자 권한이 있는지 확인
- 브라우저 새로고침

## 보안 주의사항

- 관리자 계정은 신중하게 관리하세요
- 관리자 비밀번호는 강력하게 설정하세요
- 관리자 계정 정보는 절대 공유하지 마세요
- 불필요한 관리자 권한은 즉시 제거하세요
