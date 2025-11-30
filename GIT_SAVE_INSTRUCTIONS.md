# Git 저장 가이드

**작성일**: 2025년 1월 30일  
**목적**: 리팩토링 전 현재 프로젝트 상태를 Git에 저장

---

## 🔍 현재 상태 확인

### Git 저장소 확인
```bash
cd 11.25/my_first_project/IdeaSpark
git status
```

**결과에 따른 조치**:
- `fatal: not a git repository`: Git 저장소 초기화 필요 (방법 1)
- 정상 출력: 기존 저장소 사용 (방법 2)

---

## 📋 Git 저장 단계

### Step 1: .gitignore 확인

`.gitignore` 파일에 다음이 포함되어 있는지 확인:
```
# 환경 변수
.env.local
.env*.local

# 의존성
node_modules/

# 빌드 결과물
dist/
build/

# 로그
*.log

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db
```

### Step 2: Git 저장소 초기화 (필요한 경우)

```bash
cd 11.25/my_first_project/IdeaSpark

# Git 저장소 초기화
git init

# .gitignore 확인
cat .gitignore
```

### Step 3: 파일 추가 및 커밋

```bash
# 모든 파일 추가
git add .

# 커밋 메시지와 함께 커밋
git commit -m "feat: 프로젝트 현재 상태 보존 - 리팩토링 전 백업

주요 변경사항:
- 세션 연속성 문서 추가 (SESSION_CONTINUITY.md)
- UI 개선 계획서 추가 (UI_IMPROVEMENT_PLAN.md)
- Pixel 4a 무한 저장 구현 가이드 추가 (PIXEL_4A_UNLIMITED_STORAGE_IMPLEMENTATION.md)
- 리팩토링 계획서 추가 (REFACTORING_PLAN.md)
- 개발 진행 리포트 업데이트 (DEVELOPMENT_PROGRESS_REPORT.md)

리팩토링 전 안전한 백업 지점"
```

### Step 4: 원격 저장소 연결 (선택)

```bash
# 원격 저장소 추가 (GitHub 예시)
git remote add origin https://github.com/rmswo87/ideaspark.git

# 브랜치 생성
git branch -M main

# 원격 저장소에 푸시
git push -u origin main
```

---

## ✅ 커밋 전 확인사항

### 1. 민감한 정보 확인
```bash
# .env.local 파일이 커밋되지 않았는지 확인
git status | grep .env

# API 키 등이 코드에 하드코딩되지 않았는지 확인
grep -r "sk-" src/ --exclude-dir=node_modules
grep -r "VITE_" src/ --exclude-dir=node_modules | grep -v "import.meta.env"
```

### 2. 불필요한 파일 확인
```bash
# node_modules가 추가되지 않았는지 확인
git status | grep node_modules

# dist 폴더가 추가되지 않았는지 확인
git status | grep dist
```

### 3. 변경사항 확인
```bash
# 커밋할 파일 목록 확인
git status

# 변경사항 미리보기
git diff --cached
```

---

## 🚨 문제 해결

### 문제 1: .env.local 파일이 커밋됨
```bash
# .env.local 제거
git rm --cached .env.local

# .gitignore에 추가 확인
echo ".env.local" >> .gitignore

# 다시 커밋
git add .gitignore
git commit -m "fix: .env.local 제거 및 .gitignore 업데이트"
```

### 문제 2: node_modules가 커밋됨
```bash
# node_modules 제거
git rm -r --cached node_modules

# .gitignore 확인
echo "node_modules/" >> .gitignore

# 다시 커밋
git add .gitignore
git commit -m "fix: node_modules 제거 및 .gitignore 업데이트"
```

### 문제 3: 커밋 메시지 수정
```bash
# 마지막 커밋 메시지 수정
git commit --amend -m "새로운 커밋 메시지"
```

---

## 📊 커밋 후 확인

### 1. 커밋 로그 확인
```bash
git log --oneline -5
```

### 2. 현재 상태 확인
```bash
git status
```

### 3. 브랜치 확인
```bash
git branch
```

---

## 🔄 리팩토링 중 Git 사용

### 각 단계마다 커밋
```bash
# Phase 1 Step 1 완료 후
git add .
git commit -m "refactor: Phase 1 Step 1 - 중복 문서 병합 완료"

# Phase 1 Step 2 완료 후
git add .
git commit -m "refactor: Phase 1 Step 2 - 사용하지 않는 문서 제거 완료"
```

### 문제 발생 시 롤백
```bash
# 마지막 커밋 취소 (변경사항 유지)
git reset --soft HEAD~1

# 마지막 커밋 취소 (변경사항 제거)
git reset --hard HEAD~1

# 특정 커밋으로 되돌리기
git reset --hard <commit-hash>
```

---

## 📝 권장 Git 워크플로우

### 1. 리팩토링 브랜치 생성
```bash
# 리팩토링 브랜치 생성
git checkout -b refactoring/cleanup

# 작업 진행
# ...

# 완료 후 메인 브랜치에 병합
git checkout main
git merge refactoring/cleanup
```

### 2. 작은 단위 커밋
- 각 Step 완료 후 즉시 커밋
- 명확한 커밋 메시지 작성
- 관련 없는 변경사항은 별도 커밋

### 3. 정기적 백업
- 하루 작업 종료 시 원격 저장소에 푸시
- 중요한 변경사항은 태그 생성

---

## 🎯 다음 단계

1. **Git 저장 완료 확인**
   ```bash
   git log --oneline -1
   ```

2. **리팩토링 시작**
   - `REFACTORING_PLAN.md` 참조
   - Phase 1 Step 1부터 순차 진행

3. **각 단계마다 검증**
   - 빌드 테스트
   - 런타임 테스트
   - 기능 테스트

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 1월 30일

