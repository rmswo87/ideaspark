# 🔍 OAuth 승인 페이지 URL 표시 문제

**작성일**: 2025년 1월 30일  
**목적**: Google/GitHub OAuth 승인 페이지에 Supabase URL이 표시되는 이유와 제한사항 설명

---

## ⚠️ 문제 현상

Google/GitHub OAuth 승인 페이지에서 다음과 같이 표시됨:
```
djxiousdavdwwznufpzs.supabase.co(으)로 이동
```

사용자는 이 메시지가 애플리케이션 도메인(`https://ideaspark-pi.vercel.app`) 대신 Supabase 도메인으로 표시되는 것을 원하지 않습니다.

---

## 🔍 원인 분석

### 기술적 제약사항

**Google OAuth의 동작 방식:**
1. OAuth 요청 시 `redirect_uri` 파라미터가 필수입니다
2. Supabase를 사용하는 경우, `redirect_uri`는 **반드시** Supabase의 callback URL이어야 합니다:
   ```
   https://djxiousdavdwwznufpzs.supabase.co/auth/v1/callback
   ```
3. Google은 이 `redirect_uri`의 도메인을 기반으로 승인 페이지에 표시할 URL을 결정합니다
4. 따라서 Supabase URL이 표시되는 것은 **정상적인 동작**입니다

**왜 변경할 수 없나요?**
- Supabase는 OAuth 인증을 중간에서 처리하는 프록시 역할을 합니다
- 실제 인증 흐름:
  1. 사용자 → Google/GitHub (인증)
  2. Google/GitHub → Supabase (콜백, 토큰 처리)
  3. Supabase → 애플리케이션 (최종 리디렉션)
- 이 과정에서 Supabase의 callback URL이 필수이므로, Google은 Supabase 도메인을 표시합니다

---

## ✅ 개선 방법 (제한적)

### Google OAuth 동의 화면 설정

Google OAuth 동의 화면에서 "승인된 도메인"을 추가하면, Google이 애플리케이션 도메인을 신뢰할 수 있는 도메인으로 인식합니다:

1. **Google Cloud Console** 접속
2. **"API 및 서비스"** > **"OAuth 동의 화면"** 이동
3. **"승인된 도메인"** 섹션 찾기
4. **"+ 도메인 추가"** 클릭
5. 다음 도메인 추가:
   ```
   ideaspark-pi.vercel.app
   ```
6. **"저장"** 클릭

**효과:**
- Google이 애플리케이션 도메인을 검증된 도메인으로 인식
- 사용자에게 더 신뢰할 수 있는 앱으로 표시될 수 있음
- ⚠️ **하지만 승인 페이지의 리디렉션 URL 표시는 여전히 Supabase URL로 표시됩니다**

---

## 📝 결론

### 변경 불가능한 이유

1. **OAuth 표준 준수**: OAuth 2.0 표준에 따라 `redirect_uri`는 실제 콜백을 받는 URL이어야 합니다
2. **Supabase 아키텍처**: Supabase가 OAuth를 중간에서 처리하므로, Supabase callback URL이 필수입니다
3. **보안 요구사항**: Google/GitHub는 실제 콜백을 받는 도메인을 표시하여 사용자에게 투명성을 제공합니다

### 대안

1. **사용자 교육**: 
   - OAuth 승인 페이지에서 Supabase URL이 표시되는 것은 정상이며, 실제로는 애플리케이션으로 리디렉션된다는 것을 설명
   - 인증 후 실제로 애플리케이션 도메인으로 이동하는 것을 확인

2. **사용자 경험 개선**:
   - OAuth 승인 후 즉시 애플리케이션으로 리디렉션되므로, 사용자는 Supabase URL을 거의 보지 않습니다
   - 인증 완료 후 애플리케이션의 환영 메시지나 안내를 표시하여 사용자 경험 개선

3. **직접 OAuth 구현** (고급):
   - Supabase를 사용하지 않고 직접 OAuth를 구현하면 애플리케이션 도메인을 표시할 수 있습니다
   - 하지만 이는 Supabase의 인증 기능을 포기하는 것을 의미하며, 권장되지 않습니다

---

## 💡 권장사항

**현재 상태 유지 권장:**
- Supabase를 사용하는 한, OAuth 승인 페이지에 Supabase URL이 표시되는 것은 정상입니다
- 실제 사용자 경험에는 큰 영향을 주지 않습니다 (인증 후 즉시 애플리케이션으로 이동)
- Google OAuth 동의 화면에서 "승인된 도메인"을 추가하여 신뢰도를 높이는 것을 권장합니다

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025년 1월 30일

