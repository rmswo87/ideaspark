# OpenRouter API 설정 가이드

## OpenRouter란?

OpenRouter는 여러 AI 모델을 통합하여 제공하는 서비스입니다. 무료 모델도 제공하므로 로컬 개발 환경에서도 사용할 수 있습니다.

## 로컬 환경에서 OpenRouter 설정하기

### 1. OpenRouter API 키 발급

1. https://openrouter.ai/ 접속
2. 회원가입 또는 로그인
3. https://openrouter.ai/keys 페이지로 이동
4. "Create Key" 버튼 클릭하여 API 키 생성
5. 생성된 API 키 복사

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# OpenRouter API 설정
VITE_AI_PROVIDER=openrouter
VITE_OPENROUTER_API_KEY=your_api_key_here
VITE_OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct
```

**중요**: `your_api_key_here` 부분을 실제 API 키로 교체하세요.

### 3. 무료 모델 옵션

OpenRouter에서 사용 가능한 무료 모델:

- `meta-llama/llama-3.1-8b-instruct` (권장) - 안정적이고 빠름
- `mistralai/mistral-7b-instruct` - 무료 모델
- `google/gemini-flash-1.5-8b` - 구버전 (사용 가능 여부 확인 필요)

### 4. 개발 서버 재시작

환경 변수를 변경한 후에는 개발 서버를 재시작해야 합니다:

```bash
# 개발 서버 중지 (Ctrl+C)
# 그 다음 다시 시작
npm run dev
```

## 문제 해결

### 401 에러 발생 시

1. **API 키 확인**: `.env.local` 파일에 `VITE_OPENROUTER_API_KEY`가 올바르게 설정되어 있는지 확인
2. **서버 재시작**: 환경 변수 변경 후 개발 서버를 재시작했는지 확인
3. **API 키 유효성**: OpenRouter 대시보드에서 API 키가 활성화되어 있는지 확인
4. **할당량 확인**: 무료 모델의 일일 할당량을 초과하지 않았는지 확인

### API 키가 설정되지 않은 경우

에러 메시지에 다음이 표시됩니다:
```
OpenRouter API key is not configured. Please set VITE_OPENROUTER_API_KEY in your .env.local file. Get your API key from https://openrouter.ai/keys
```

이 경우 `.env.local` 파일을 생성하고 API 키를 설정하세요.

## 무료 할당량

OpenRouter의 무료 모델 정책은 모델마다 다를 수 있으며, 정책이 변경될 수 있습니다.

**일반적인 무료 모델 제한:**
- 일부 모델은 일일 요청 횟수 제한이 있을 수 있음
- 일부 모델은 분당 요청 횟수 제한이 있을 수 있음
- 정확한 제한 사항은 OpenRouter 공식 사이트에서 확인 필요

**확인 방법:**
1. https://openrouter.ai/models 접속
2. 사용 중인 모델 선택
3. "Pricing" 또는 "Limits" 섹션 확인

**참고:**
- `meta-llama/llama-3.1-8b-instruct`는 일반적으로 무료로 제공되며, 제한이 비교적 관대함
- 무료 모델도 정책 변경에 따라 제한이 추가될 수 있음
- 정확한 정보는 OpenRouter 대시보드에서 확인 가능

## 참고 자료

- OpenRouter 공식 사이트: https://openrouter.ai/
- API 문서: https://openrouter.ai/docs
- 모델 목록: https://openrouter.ai/models

