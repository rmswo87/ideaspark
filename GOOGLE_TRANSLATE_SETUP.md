# Google Translate API 설정 가이드

## 🚀 빠른 설정 (5분)

### 1단계: Vercel 환경변수 설정

1. Vercel 대시보드 접속: https://vercel.com/dashboard
2. `ideaspark` 프로젝트 선택
3. **Settings** → **Environment Variables** 클릭
4. 다음 환경변수 추가:

```
GOOGLE_TRANSLATE_API_KEY = AIzaSyD1x3i3rJ_9SUMsTvFkaHhz5Q2Xsr83XgY
```

**중요**: 
- `GOOGLE_TRANSLATE_API_KEY`는 **VITE_ 접두사 없이** 설정 (서버 사이드 전용)
- **Production**, **Preview**, **Development** 모두 체크

### 2단계: 재배포

환경변수 적용을 위해 재배포:

```bash
# Vercel CLI 사용 시
vercel --prod
```

또는 Vercel 대시보드에서 **Deployments** → **Redeploy** 클릭

---

## 📊 한도 관리

### Google Translate API 무료 티어
- **월 500,000자** 무료
- 그 이후는 유료 ($20/1M자)

### 현재 설정
- **카드당 최대 300자** 제한 (제목 100자 + 내용 200자)
- **100개 아이디어** = 약 30,000자 (월 한도의 **6%**만 사용)
- 안전하게 무료 티어 내에서 사용 가능

### 한도 모니터링
Google Cloud Console에서 사용량 확인:
1. https://console.cloud.google.com/apis/dashboard 접속
2. **Cloud Translation API** 선택
3. **Quotas** 탭에서 사용량 확인

---

## 🔄 폴백 메커니즘

1. **Google Translate API** (기본값, API 키가 있으면)
2. **LibreTranslate** (Google Translate 실패 시 자동 폴백)
3. **Chrome 자동 번역 안내** (모든 번역 실패 시)

---

## ✅ 확인 사항

배포 후 다음을 확인하세요:

1. **번역 작동 확인**
   - 대시보드에서 아이디어 카드의 번역된 내용 확인
   - 콘솔에서 에러 메시지 확인

2. **한도 확인**
   - Google Cloud Console에서 사용량 모니터링
   - 월 400,000자 이하로 유지 권장 (안전 마진)

3. **폴백 확인**
   - API 키를 제거하면 LibreTranslate로 자동 전환되는지 확인

---

## 🐛 문제 해결

### 번역이 작동하지 않음
1. Vercel 환경변수 확인 (`GOOGLE_TRANSLATE_API_KEY`)
2. 재배포 확인
3. 브라우저 콘솔에서 에러 메시지 확인
4. Vercel Functions 로그 확인

### 한도 초과 경고
- Google Cloud Console에서 사용량 확인
- 텍스트 길이 제한 확인 (현재 300자)
- 필요시 제한을 더 낮춤 (예: 200자)

---

## 📝 참고사항

- 번역은 **제목과 간략한 내용만** 번역 (메인 화면 표시용)
- 전체 내용은 Reddit 번역 페이지 또는 Chrome 자동 번역 사용
- Chrome 자동 번역 안내는 번역 실패 시 자동으로 표시됨
