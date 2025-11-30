# main 브랜치 클론 및 로컬 빌드 가이드

## 현재 상황 정리

- ✅ **GitHub main 브랜치**: 모바일 최적화 완료된 최신 버전 (방금 푸시 완료)
- ❌ **GitHub github-pages-deployment 브랜치**: 구버전 (사용 안 함)
- ❌ **로컬 디렉토리**: git 저장소가 아님

## 로컬에서 main 브랜치 클론하기

### 방법 1: 새 디렉토리에 클론 (권장)

```bash
# 1. 상위 디렉토리로 이동
cd E:\study\Business\Develope\cursor\11.25\my_first_project

# 2. main 브랜치 클론
git clone -b main https://github.com/rmswo87/ideaspark.git ideaspark-main

# 3. 클론한 디렉토리로 이동
cd ideaspark-main

# 4. 의존성 설치
npm install

# 5. 환경 변수 설정 (.env.local 파일 생성)
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# VITE_OPENROUTER_API_KEY=your_openrouter_api_key
# VITE_OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct
# VITE_AI_PROVIDER=openrouter
# VITE_API_PROVIDER=vercel

# 6. 개발 서버 실행
npm run dev
```

### 방법 2: 현재 디렉토리를 git 저장소로 초기화

```bash
# 현재 디렉토리에서 실행
cd E:\study\Business\Develope\cursor\11.25\my_first_project\IdeaSpark

# 1. git 저장소 초기화
git init

# 2. 원격 저장소 추가
git remote add origin https://github.com/rmswo87/ideaspark.git

# 3. main 브랜치 가져오기
git fetch origin main

# 4. main 브랜치 체크아웃
git checkout -b main origin/main

# 5. 의존성 설치
npm install

# 6. 개발 서버 실행
npm run dev
```

## 확인 사항

클론 후 다음을 확인하세요:

1. **브랜치 확인**
   ```bash
   git branch
   # * main 이 표시되어야 함
   ```

2. **최신 커밋 확인**
   ```bash
   git log --oneline -5
   # 최신 커밋에 "feat: 모바일 최적화 및 필터링 개선" 이 있어야 함
   ```

3. **파일 확인**
   - `src/App.tsx`에 모바일 최적화 코드가 있는지 확인
   - `src/index.css`에 `touch-manipulation` 클래스가 있는지 확인

## 주의사항

- ⚠️ `github-pages-deployment` 브랜치는 구버전이므로 사용하지 마세요
- ✅ 항상 `main` 브랜치를 기준으로 작업하세요
- ✅ 로컬 변경사항을 `main` 브랜치에 푸시하면 Vercel이 자동으로 배포합니다

