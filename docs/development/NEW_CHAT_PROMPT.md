# 새 채팅 시작 프롬프트

이 문서는 새 채팅 세션을 시작할 때 AI Assistant에게 제공할 프롬프트입니다.

---

## 📋 새 채팅 시작 프롬프트 (복사하여 사용)

```
안녕하세요. IdeaSpark 프로젝트 작업을 이어서 진행하겠습니다.

## 프로젝트 정보
- 프로젝트명: IdeaSpark (Reddit 아이디어를 PRD로 변환하는 AI 기반 플랫폼)
- 프로젝트 경로: 11.25/my_first_project/IdeaSpark
- GitHub 저장소: https://github.com/rmswo87/ideaspark
- Vercel 프로젝트: ideaspark-pi (prj_4GqulAzDmUyDB4NHNuMC07zPrLfX)

## ⚠️ 중요 주의사항
1. **Git 작업은 반드시 프로젝트 폴더에서만 수행**
   - 작업 경로: 11.25/my_first_project/IdeaSpark
   - 최상위 cursor 폴더에서 git push 하면 안 됨
   - 프로젝트 폴더에서만 git 작업 수행

2. **GitHub 저장소는 rmswo87/ideaspark만 사용**
   - 다른 저장소나 계정에 push 하지 않음

3. **작업 전 확인**
   - 현재 작업 디렉토리 확인
   - Git 저장소 위치 확인 (git rev-parse --show-toplevel)
   - Remote 설정 확인 (git remote -v)

## 현재 상황
- 최근 완료: React 보안 패치, 자동 아이디어 수집 Cron Job 구현, 문서 업데이트
- 진행 중: Vercel 자동 배포 문제 해결 (GitHub push 후 자동 배포 미작동)
- 최근 커밋: d0a512c (문서 업데이트 - Git 작업 경로 규칙, 세션 연속성 문서)

## 참고 문서
- 세션 연속성: docs/development/SESSION_CONTINUITY.md
- 배포 가이드: docs/deployment/VERCEL_DEPLOY.md
- GitHub Webhook 설정: docs/deployment/GITHUB_WEBHOOK_SETUP.md

먼저 SESSION_CONTINUITY.md 파일을 읽어서 전체 상황을 파악한 후 작업을 진행해주세요.
```

---

## 🚀 빠른 시작 가이드

### 1. 프로젝트 경로로 이동
```bash
cd "11.25/my_first_project/IdeaSpark"
```

### 2. Git 상태 확인
```bash
git rev-parse --show-toplevel  # 저장소 위치 확인
git remote -v                   # Remote 확인
git status                      # 현재 상태 확인
```

### 3. 세션 연속성 문서 읽기
```bash
# SESSION_CONTINUITY.md 파일 읽기
```

### 4. 현재 작업 확인
- Vercel 배포 상태 확인
- 최근 커밋 확인
- 진행 중인 작업 확인

---

## 📝 작업 시 체크리스트

### Git 작업 전
- [ ] 작업 디렉토리가 프로젝트 폴더인지 확인
- [ ] Git 저장소 위치 확인
- [ ] Remote가 올바른지 확인 (`rmswo87/ideaspark`)

### 커밋 전
- [ ] 변경사항 확인 (`git status`)
- [ ] 빌드 테스트 (`npm run build`)
- [ ] 타입 체크 (`npm run type-check` - 있다면)

### Push 전
- [ ] 커밋 메시지 확인
- [ ] 프로젝트 폴더에서 push하는지 확인
- [ ] Remote가 올바른지 확인

### 배포 후
- [ ] Vercel 대시보드에서 배포 상태 확인
- [ ] 배포 로그 확인
- [ ] 사이트 접속 테스트

---

## 🔗 주요 링크

- **GitHub 저장소**: https://github.com/rmswo87/ideaspark
- **Vercel 대시보드**: https://vercel.com/dashboard
- **프로덕션 사이트**: https://ideaspark-pi.vercel.app
- **Supabase 대시보드**: (환경 변수에서 확인)

---

**작성일**: 2025년 12월 16일  
**최종 업데이트**: 2025년 12월 16일  
**목적**: 새 채팅 세션에서 빠르게 프로젝트 맥락 파악 및 작업 이어가기
