# main 브랜치 동기화 가이드

## 현재 상황

- **로컬 파일**: 모바일 최적화 완료된 최신 버전 ✅
- **GitHub main 브랜치**: 모바일 최적화 없는 구버전 ❌
- **GitHub github-pages-deployment 브랜치**: 구버전 (사용 안 함)

## 해결 방법

현재 로컬의 모바일 최적화 코드를 GitHub `main` 브랜치에 푸시해야 합니다.

### 옵션 1: 현재 디렉토리를 git 저장소로 초기화 (권장)

```bash
# 1. git 저장소 초기화
git init

# 2. GitHub main 브랜치를 원격 저장소로 추가
git remote add origin https://github.com/rmswo87/ideaspark.git

# 3. main 브랜치 가져오기
git fetch origin main

# 4. main 브랜치를 로컬에 체크아웃
git checkout -b main origin/main

# 5. 현재 변경사항 병합 (충돌 해결 필요할 수 있음)
git add .
git commit -m "feat: 모바일 최적화 및 필터링 개선"

# 6. main 브랜치에 푸시
git push origin main
```

### 옵션 2: 새 디렉토리에 main 브랜치 클론

```bash
# 1. 새 디렉토리로 이동
cd ..

# 2. main 브랜치 클론
git clone -b main https://github.com/rmswo87/ideaspark.git ideaspark-main

# 3. 클론한 디렉토리로 이동
cd ideaspark-main

# 4. 의존성 설치
npm install

# 5. 개발 서버 실행
npm run dev
```

## 주의사항

- `github-pages-deployment` 브랜치는 구버전이므로 사용하지 마세요
- 항상 `main` 브랜치를 기준으로 작업하세요
- 로컬 변경사항을 `main` 브랜치에 푸시하면 Vercel이 자동으로 배포합니다

