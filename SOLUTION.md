# 문제 해결 방안

## 🔴 현재 문제점

### 1. 복잡한 서버 구조
**문제**: 로컬 개발 시 두 개의 서버를 실행해야 함
- API 서버 (`npm run dev:api`) - 포트 3000
- 개발 서버 (`npm run dev`) - 포트 5173

**원인**: Reddit API CORS 문제로 인해 서버 사이드에서 호출해야 함

### 2. Vercel 배포 미완료
**문제**: Vercel 배포가 안 되어 있어서:
- Reddit API Secret을 Vercel 환경변수에 설정할 수 없음
- 프로덕션 환경에서 테스트 불가
- Edge Function 사용 불가

---

## ✅ 해결 방안

### 방안 1: Vercel 배포 완료 (권장, 가장 중요)

**장점**:
- 단일 명령어로 개발 가능 (`vercel dev`)
- 프로덕션 환경과 동일한 구조
- 환경변수 관리 용이
- Edge Function 자동 배포

**단계**:
1. Vercel CLI 설치 및 로그인
2. 프로젝트 배포
3. 환경변수 설정 (Reddit API 키)
4. 로컬 개발 시 `vercel dev` 사용

**예상 시간**: 30분

### 방안 2: Supabase Edge Function 사용 (대안)

**장점**:
- Supabase 프로젝트 내에서 모든 것 관리
- 별도 서버 불필요
- 무료 플랜 지원

**단점**:
- Supabase Edge Function 학습 필요
- Vercel보다 제한적

**예상 시간**: 1-2시간

### 방안 3: Vite 프록시 활용 (임시 해결책)

**장점**:
- 즉시 적용 가능
- 단일 개발 서버로 통합

**단점**:
- 로컬 개발 전용
- 프로덕션 환경과 다름

**예상 시간**: 15분

---

## 🎯 권장 해결 순서

### 1단계: Vercel 배포 (최우선)
```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 배포
cd 11.25/my_first_project/IdeaSpark
vercel

# 환경변수 설정 (Vercel 대시보드에서)
# REDDIT_CLIENT_ID
# REDDIT_CLIENT_SECRET

# 로컬 개발 (단일 명령어)
vercel dev
```

### 2단계: 코드 수정
- `collector.ts`에서 API URL을 `/api/collect-ideas`로 통일
- 로컬/프로덕션 구분 제거

### 3단계: 테스트
- 실제 Reddit 데이터 수집 테스트
- PRD 생성 테스트

---

## 📋 즉시 적용 가능한 임시 해결책

로컬 개발을 단순화하기 위해 Vite 프록시를 사용할 수 있습니다.
하지만 **Vercel 배포가 최종 해결책**입니다.

