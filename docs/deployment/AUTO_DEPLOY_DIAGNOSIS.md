# Vercel 자동 배포 진단 및 해결 가이드

**작성일**: 2025년 12월 16일  
**상태**: 진행 중  
**목적**: Vercel 자동 배포 미작동 문제 해결

---

## 📊 현재 상황

### 확인 완료 ✅
- ✅ GitHub 저장소: `rmswo87/ideaspark` (올바름)
- ✅ 최신 커밋: `4038bab` (GitHub에 푸시 완료)
- ✅ Remote 설정: 올바름
- ✅ 로컬과 원격 동기화: 완료

### 확인 필요 ⚠️
- ❓ Vercel 프로젝트 Git 연결 상태
- ❓ GitHub Webhook 설정
- ❓ Vercel Production Branch 설정
- ❓ Webhook Delivery 로그

---

## 🔍 단계별 진단 및 해결

### 1단계: Vercel 프로젝트 Git 연결 확인

**확인 위치**: Vercel 대시보드 → Settings → Git

**확인 사항**:
1. **Connected Git Repository**
   - [ ] `rmswo87/ideaspark`가 연결되어 있는지 확인
   - [ ] 연결이 안 되어 있다면 "Connect Git Repository" 클릭

2. **Production Branch**
   - [ ] `main`으로 설정되어 있는지 확인
   - [ ] 다른 값이면 `main`으로 변경

**사용자 확인 필요**: 
- Vercel 대시보드에서 위 항목들을 확인하고 결과를 알려주세요.

---

### 2단계: GitHub Webhook 설정 확인

**확인 위치**: GitHub 저장소 → Settings → Webhooks

**확인 사항**:
1. **Webhook 존재 여부**
   - [ ] Vercel webhook이 있는지 확인
   - [ ] Webhook URL이 `https://api.vercel.com/v1/integrations/github`로 시작하는지 확인

2. **Webhook 설정**
   - [ ] "Active" 상태인지 확인
   - [ ] "Just the push event" 또는 "push" 이벤트가 선택되어 있는지 확인

3. **최근 Delivery**
   - [ ] Webhook을 클릭하여 "Recent Deliveries" 확인
   - [ ] 최근 push 이벤트가 있는지 확인
   - [ ] 성공(초록색 체크)인지 실패(빨간색 X)인지 확인

**사용자 확인 필요**:
- GitHub 저장소의 Webhook 설정을 확인하고 결과를 알려주세요.
- 특히 최근 Delivery 상태를 확인해주세요.

---

### 3단계: Webhook Delivery 로그 분석

**확인 위치**: GitHub → Settings → Webhooks → [Webhook 클릭] → Recent Deliveries

**확인 사항**:
1. **최근 Delivery 확인**
   - [ ] 커밋 `4038bab`에 대한 webhook delivery가 있는지 확인
   - [ ] Response 상태 코드 확인 (200이면 성공)

2. **실패한 경우**
   - [ ] Response 탭에서 에러 메시지 확인
   - [ ] Request 탭에서 payload 확인

**사용자 확인 필요**:
- Webhook Delivery 로그를 확인하고 결과를 알려주세요.

---

### 4단계: Vercel 배포 로그 확인

**확인 위치**: Vercel 대시보드 → Deployments

**확인 사항**:
1. **최근 배포 확인**
   - [ ] 커밋 `4038bab`로 배포가 시작되었는지 확인
   - [ ] 배포 상태 확인 (Building, Ready, Error 등)

2. **배포가 없는 경우**
   - [ ] 최근 배포가 언제인지 확인
   - [ ] 어떤 커밋으로 배포되었는지 확인

**사용자 확인 필요**:
- Vercel 대시보드의 Deployments 탭을 확인하고 결과를 알려주세요.

---

## 🔧 해결 방법 (단계별)

### 해결 방법 1: Vercel Git 연결 재설정

**시도 조건**: 
- Vercel에 Git 저장소가 연결되어 있지만 자동 배포가 작동하지 않는 경우

**단계**:
1. Vercel 대시보드 → Settings → Git
2. "Disconnect" 클릭 (Git 연결 해제)
3. "Connect Git Repository" 클릭
4. `rmswo87/ideaspark` 선택
5. Production Branch를 `main`으로 설정
6. 저장

**예상 결과**: 
- Webhook이 자동으로 재설정됨
- 다음 push부터 자동 배포가 작동해야 함

---

### 해결 방법 2: GitHub Webhook 수동 재설정

**시도 조건**: 
- Vercel Git 연결은 되어 있지만 Webhook이 없거나 비활성화된 경우

**단계**:
1. GitHub → Settings → Webhooks
2. 기존 Vercel webhook이 있다면 삭제
3. "Add webhook" 클릭
4. 다음 정보 입력:
   - **Payload URL**: `https://api.vercel.com/v1/integrations/github/webhooks`
   - **Content type**: `application/json`
   - **Which events**: "Just the push event" 선택
   - **Active**: 체크
5. "Add webhook" 클릭

**주의**: 
- 일반적으로 Vercel이 자동으로 webhook을 설정하므로, 이 방법은 자동 설정이 실패한 경우에만 사용

---

### 해결 방법 3: Vercel 프로젝트 재생성 (최후의 수단)

**시도 조건**: 
- 위 방법들이 모두 실패한 경우

**단계**:
1. Vercel 대시보드에서 새 프로젝트 생성
2. `rmswo87/ideaspark` 저장소 연결
3. Production Branch를 `main`으로 설정
4. 환경 변수 재설정
5. 배포 확인

**주의**: 
- 이 방법은 프로젝트 ID가 변경되므로 최후의 수단으로만 사용

---

## 📋 확인 체크리스트

다음 항목들을 순서대로 확인하고 체크해주세요:

### 기본 확인
- [ ] GitHub 저장소: `rmswo87/ideaspark` (확인 완료)
- [ ] 최신 커밋: `4038bab` (GitHub에 푸시 완료)
- [ ] Vercel 프로젝트: `ideaspark-pi` 존재

### Vercel 설정 확인
- [ ] Vercel → Settings → Git → Connected Git Repository: `rmswo87/ideaspark`
- [ ] Vercel → Settings → Git → Production Branch: `main`
- [ ] Vercel → Deployments: 최근 배포 확인

### GitHub Webhook 확인
- [ ] GitHub → Settings → Webhooks: Vercel webhook 존재
- [ ] Webhook URL: `https://api.vercel.com/v1/integrations/github`로 시작
- [ ] Webhook Active: 체크됨
- [ ] Webhook Events: `push` 이벤트 선택
- [ ] Recent Deliveries: 최근 push 이벤트 확인

### 배포 확인
- [ ] Vercel → Deployments: 커밋 `4038bab`로 배포 시작됨
- [ ] 배포 상태: Building 또는 Ready

---

## 🎯 다음 단계

1. **사용자가 확인해야 할 사항**:
   - 위 체크리스트의 항목들을 확인하고 결과를 알려주세요.
   - 특히 다음을 우선 확인:
     - Vercel Git 연결 상태
     - GitHub Webhook 존재 및 상태
     - 최근 Webhook Delivery 로그

2. **확인 결과에 따른 조치**:
   - Git 연결이 안 되어 있으면 → 해결 방법 1 시도
   - Webhook이 없거나 비활성화 → 해결 방법 2 시도
   - 모든 설정이 올바른데도 안 되면 → 해결 방법 3 고려

---

## 📝 참고 사항

1. **일반적인 원인**:
   - Vercel Git 연결이 끊어진 경우
   - GitHub Webhook이 삭제되거나 비활성화된 경우
   - Production Branch 설정이 잘못된 경우
   - Vercel 프로젝트 설정 오류

2. **자동 배포 작동 조건**:
   - Vercel에 Git 저장소가 연결되어 있어야 함
   - GitHub에 Vercel webhook이 설정되어 있어야 함
   - Production Branch(`main`)에 push가 발생해야 함
   - Webhook이 `push` 이벤트를 수신해야 함

3. **디버깅 팁**:
   - Webhook Delivery 로그를 자세히 확인하면 원인을 파악할 수 있음
   - Vercel 대시보드의 배포 로그도 유용함
   - 필요시 Vercel 지원팀에 문의

---

**작성일**: 2025년 12월 16일  
**상태**: 진행 중  
**다음 업데이트**: 사용자 확인 결과 반영 후

