# GitHub Pages 수동 설정 가이드

GitHub Pages는 저장소 Settings에서 수동으로 활성화해야 합니다.

**최종 업데이트**: 2025-11-28

## 설정 방법

1. GitHub 저장소로 이동: https://github.com/rmswo87/ideaspark
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Pages** 클릭
4. **Source** 섹션에서:
   - **"GitHub Actions"** 선택
   - 저장 버튼 클릭

## 확인

설정이 완료되면:
- 워크플로우가 자동으로 실행됩니다
- 배포가 완료되면 `https://rmswo87.github.io/ideaspark/`에서 사이트를 확인할 수 있습니다

## 참고

- GitHub Pages는 정적 파일만 호스팅 가능합니다 (Edge Functions 불가)
- Vercel Functions는 GitHub Pages에서 작동하지 않으므로, Supabase Edge Functions를 사용해야 합니다
- 환경 변수는 GitHub Secrets에 설정되어 있어야 합니다

