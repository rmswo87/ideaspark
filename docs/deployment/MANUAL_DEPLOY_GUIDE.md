# Vercel 수동 배포 가이드

**작성일**: 2025년 12월 16일  
**상황**: 자동 배포가 트리거되지 않아 Deployments 리스트에 최신 커밋이 없는 경우

---

## 🎯 문제 상황

- GitHub에 커밋은 푸시되었지만 Vercel Deployments 리스트에 나타나지 않음
- Cron Job 제한으로 인해 자동 배포가 실패했을 가능성
- 수동 재배포를 할 수 없음 (리스트에 없으므로)

---

## 🔧 해결 방법

### 방법 1: Vercel 대시보드에서 직접 배포 생성 (가장 간단)

**단계**:
1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - `ideaspark-pi` 프로젝트 선택

2. **Deployments 탭 확인**
   - 상단에 "Deploy" 또는 "Create Deployment" 버튼이 있는지 확인
   - 또는 오른쪽 상단의 "..." 메뉴에서 "Deploy" 옵션 확인

3. **GitHub 커밋 선택**
   - 배포할 커밋 선택 (최신 커밋 `940a686`)
   - Production 환경 선택
   - "Deploy" 클릭

**참고**: 
- Vercel 대시보드 UI에 따라 버튼 위치가 다를 수 있습니다
- "Deployments" 탭 상단 또는 프로젝트 설정에서 찾을 수 있습니다

---

### 방법 2: Vercel CLI로 수동 배포

**전제 조건**: Vercel CLI 로그인 필요

**단계**:
```bash
# 1. Vercel 로그인
vercel login

# 2. 프로젝트 디렉토리로 이동
cd "11.25/my_first_project/IdeaSpark"

# 3. 프로덕션 배포
vercel --prod

# 또는 특정 커밋으로 배포하려면
git checkout 940a686
vercel --prod
```

**주의**: 
- 로컬에서 배포하면 현재 작업 디렉토리의 코드가 배포됩니다
- GitHub의 특정 커밋을 배포하려면 해당 커밋으로 checkout 후 배포해야 합니다

---

### 방법 3: 빈 커밋으로 재트리거 (Webhook 테스트)

**목적**: GitHub Webhook이 정상 작동하는지 확인

**단계**:
```bash
# 1. 프로젝트 디렉토리로 이동
cd "11.25/my_first_project/IdeaSpark"

# 2. 빈 커밋 생성
git commit --allow-empty -m "chore: Vercel 배포 재트리거 테스트"

# 3. GitHub에 푸시
git push origin main
```

**예상 결과**:
- GitHub Webhook이 트리거되어 Vercel에 배포가 시작되어야 함
- Deployments 리스트에 새 배포가 나타나야 함

---

### 방법 4: GitHub Actions를 통한 배포

**장점**: 
- Vercel 제한 없이 배포 가능
- 자동화 가능

**단계**:
1. `.github/workflows/deploy.yml` 파일 생성
2. GitHub Actions에서 Vercel CLI를 사용하여 배포
3. GitHub Secrets에 Vercel 토큰 설정

**참고**: 
- 이 방법은 추가 설정이 필요하므로, 우선 방법 1-3을 시도하는 것을 권장합니다

---

## 🔍 문제 진단

### 배포가 리스트에 나타나지 않는 원인

1. **Cron Job 제한**
   - ✅ 해결됨: `vercel.json`에서 Cron Job을 하루 1회로 수정

2. **GitHub Webhook 미작동**
   - Webhook이 설정되어 있지만 전송되지 않음
   - Webhook Delivery 로그 확인 필요

3. **Vercel 프로젝트 설정 오류**
   - Git 연결이 끊어짐
   - Production Branch 설정 오류

---

## 📋 확인 체크리스트

배포 전 확인 사항:

- [ ] `vercel.json`의 Cron Job 설정이 하루 1회 이하인지 확인
- [ ] GitHub에 최신 커밋이 푸시되었는지 확인
- [ ] Vercel 프로젝트에 Git 저장소가 연결되어 있는지 확인
- [ ] Production Branch가 `main`으로 설정되어 있는지 확인

---

## 🎯 권장 순서

1. **먼저 시도**: 방법 1 (Vercel 대시보드에서 직접 배포)
   - 가장 간단하고 확실한 방법
   - UI에서 직접 확인 가능

2. **안 되면**: 방법 3 (빈 커밋으로 재트리거)
   - Webhook이 정상 작동하는지 확인
   - 자동 배포가 복구되는지 확인

3. **여전히 안 되면**: 방법 2 (Vercel CLI)
   - CLI로 직접 배포하여 문제를 우회

---

## 💡 참고 사항

1. **Vercel Hobby 플랜 제한**
   - 하루에 1회만 Cron Job 실행 가능
   - 배포 자체는 제한 없음 (일일 100개 배포까지)

2. **자동 배포 복구**
   - Cron Job 설정 수정 후 자동 배포가 정상 작동해야 함
   - 다음 push부터 자동 배포가 트리거되어야 함

3. **수동 배포 후 확인**
   - 배포가 성공하면 Deployments 리스트에 나타남
   - 이후 자동 배포도 정상 작동해야 함

---

**작성일**: 2025년 12월 16일  
**상태**: 진행 중  
**다음 단계**: Vercel 대시보드에서 직접 배포 시도

