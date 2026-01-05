# GitHub Webhook 설정 가이드 (Vercel 자동 배포)

## 📋 개요

Vercel 자동 배포를 위해 GitHub webhook을 설정하는 방법입니다.  
일반적으로 Vercel 대시보드에서 GitHub를 연결하면 자동으로 webhook이 설정되지만, 수동 설정이 필요한 경우 이 가이드를 따르세요.

---

## 🔧 방법 1: Vercel 대시보드에서 자동 설정 (권장)

### 1단계: Vercel 프로젝트 설정 확인

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard 접속
   - `ideaspark` 프로젝트 선택

2. **Settings → Git 이동**
   - 왼쪽 메뉴에서 **Settings** 클릭
   - **Git** 섹션 선택

3. **GitHub 연결 확인**
   - **Connected Git Repository** 섹션 확인
   - `rmswo87/ideaspark`가 연결되어 있는지 확인
   - 연결이 안 되어 있다면 **Connect Git Repository** 클릭

4. **Production Branch 확인**
   - **Production Branch**가 `main`으로 설정되어 있는지 확인
   - 다른 값이면 `main`으로 변경

### 2단계: GitHub 연결 시 자동 webhook 설정

Vercel에서 GitHub를 연결하면 **자동으로** webhook이 설정됩니다:
- GitHub 저장소 → Settings → Webhooks에서 확인 가능
- Webhook URL: Vercel이 자동 생성 (예: `https://api.vercel.com/v1/integrations/github/...`)
- 이벤트: `push` 이벤트 자동 설정

---

## 🔧 방법 2: 수동 Webhook 설정 (자동 설정이 안 된 경우)

### 1단계: Vercel에서 Webhook URL 확인

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard 접속
   - `ideaspark` 프로젝트 선택

2. **Settings → Git → Connected Git Repository**
   - GitHub 저장소가 연결되어 있는지 확인
   - 연결되어 있다면 webhook은 자동으로 설정되어 있어야 함

### 2단계: GitHub에서 Webhook 수동 추가

**⚠️ 주의**: 일반적으로 Vercel이 자동으로 webhook을 설정하므로, 수동 설정은 **필요한 경우에만** 진행하세요.

1. **GitHub 저장소 접속**
   - https://github.com/rmswo87/ideaspark 접속

2. **Settings → Webhooks 이동**
   - 저장소 상단 메뉴에서 **Settings** 클릭
   - 왼쪽 사이드바에서 **Webhooks** 선택

3. **기존 Vercel Webhook 확인**
   - 이미 Vercel webhook이 있다면 수정만 하면 됩니다
   - Webhook URL이 `https://api.vercel.com/v1/integrations/github`로 시작하는지 확인

4. **새 Webhook 추가 (없는 경우)**
   - **Add webhook** 버튼 클릭
   - 다음 정보 입력:
     - **Payload URL**: `https://api.vercel.com/v1/integrations/github/webhooks`
     - **Content type**: `application/json` 선택
     - **Secret**: 비워두거나 원하는 값 입력 (선택사항)
     - **SSL verification**: "Enable SSL verification" 선택 (기본값)
     - **Which events would you like to trigger this webhook?**: 
       - ✅ **"Just the push event."** 선택 (권장)
       - 또는 "Let me select individual events." 선택 후 `push` 이벤트만 체크
     - **Active**: ✅ 체크 (활성화)
   - **Add webhook** 버튼 클릭

### 3단계: Webhook 테스트

1. **Webhook Delivery 확인**
   - Webhook 목록에서 방금 추가한 webhook 클릭
   - **Recent Deliveries** 탭에서 최근 이벤트 확인
   - 초록색 체크 표시(✅)가 있으면 성공

2. **테스트 커밋 푸시**
   ```bash
   git commit --allow-empty -m "test: webhook 테스트"
   git push origin main
   ```

3. **Vercel 배포 확인**
   - Vercel 대시보드 → Deployments 탭
   - 새로운 배포가 자동으로 시작되는지 확인
   - 배포가 시작되면 webhook이 정상 작동하는 것입니다

---

## 🔍 문제 해결

### 문제 1: Webhook이 전송되지 않음

**증상**: GitHub에서 webhook delivery가 실패함

**해결 방법**:
1. **Webhook URL 확인**
   - Payload URL이 정확한지 확인
   - `https://api.vercel.com/v1/integrations/github/webhooks` 형식인지 확인

2. **SSL 인증서 확인**
   - "Enable SSL verification"이 체크되어 있는지 확인

3. **이벤트 설정 확인**
   - `push` 이벤트가 선택되어 있는지 확인

### 문제 2: Webhook은 전송되지만 Vercel 배포가 안 됨

**증상**: GitHub webhook delivery는 성공하지만 Vercel에서 배포가 시작되지 않음

**해결 방법**:
1. **Vercel 프로젝트 설정 확인**
   - Settings → Git → Production Branch가 `main`인지 확인
   - Connected Git Repository가 `rmswo87/ideaspark`인지 확인

2. **Vercel 프로젝트 ID 확인**
   - 프로젝트 ID: `prj_4GqulAzDmUyDB4NHNuMC07zPrLfX`
   - 이 ID가 webhook payload에 포함되어 있는지 확인

3. **Vercel 대시보드에서 수동 배포 시도**
   - Deployments 탭 → "Redeploy" 버튼 클릭
   - 최신 커밋 선택 후 재배포

### 문제 3: 자동 배포가 여전히 안 됨

**증상**: 모든 설정이 올바른데도 자동 배포가 트리거되지 않음

**해결 방법**:
1. **Vercel GitHub 연결 재설정**
   - Settings → Git → Connected Git Repository
   - **Disconnect** 클릭
   - 다시 **Connect Git Repository** 클릭
   - `rmswo87/ideaspark` 선택
   - 이 과정에서 webhook이 자동으로 재설정됩니다

2. **GitHub 권한 확인**
   - GitHub → Settings → Applications → Authorized OAuth Apps
   - Vercel이 권한을 가지고 있는지 확인
   - 없다면 Vercel에서 다시 연결

---

## ✅ 확인 체크리스트

배포가 정상 작동하는지 확인하기 위한 체크리스트:

- [ ] Vercel 프로젝트에 GitHub 저장소가 연결되어 있음
- [ ] Production Branch가 `main`으로 설정되어 있음
- [ ] GitHub 저장소에 Vercel webhook이 존재함
- [ ] Webhook URL이 `https://api.vercel.com/v1/integrations/github`로 시작함
- [ ] Webhook이 `push` 이벤트를 수신하도록 설정되어 있음
- [ ] Webhook이 "Active" 상태임
- [ ] 최근 webhook delivery가 성공했음 (초록색 체크)
- [ ] 테스트 커밋 푸시 시 Vercel에서 자동 배포가 시작됨

---

## 📝 참고 사항

1. **자동 설정이 권장됩니다**
   - Vercel 대시보드에서 GitHub를 연결하면 자동으로 webhook이 설정됩니다
   - 수동 설정은 자동 설정이 실패한 경우에만 필요합니다

2. **Webhook URL 형식**
   - Vercel이 자동 생성하는 webhook URL은 프로젝트별로 다를 수 있습니다
   - 일반적인 형식: `https://api.vercel.com/v1/integrations/github/...`
   - 수동 설정 시: `https://api.vercel.com/v1/integrations/github/webhooks`

3. **보안**
   - Webhook Secret은 선택사항이지만, 보안을 위해 설정하는 것을 권장합니다
   - Vercel이 자동으로 설정한 webhook은 Secret이 자동으로 설정됩니다

4. **이벤트 선택**
   - `push` 이벤트만 선택하는 것이 권장됩니다
   - 모든 이벤트를 선택하면 불필요한 요청이 발생할 수 있습니다

---

## 🔗 관련 문서

- [Vercel 공식 문서 - Git Integration](https://vercel.com/docs/concepts/git)
- [GitHub Webhooks 문서](https://docs.github.com/en/developers/webhooks-and-events/webhooks)
- [SESSION_CONTINUITY.md](../development/SESSION_CONTINUITY.md) - 프로젝트 전체 상황

---

**작성일**: 2025년 12월 16일  
**최종 업데이트**: 2025년 12월 16일

