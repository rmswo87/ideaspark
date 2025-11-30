# Supabase Storage 버킷 설정 가이드

## 필수 버킷 생성

이미지 업로드 기능을 사용하려면 다음 버킷들을 Supabase에 생성해야 합니다.

### 1. 프로필 사진용 버킷 (필수)

**버킷 이름**: `avatars` 또는 `profiles` (둘 중 하나)

**설정 방법**:
1. Supabase 대시보드 접속
2. **Storage** 메뉴 클릭
3. **New bucket** 버튼 클릭
4. 다음 정보 입력:
   - **Name**: `avatars` (또는 `profiles`)
   - **Public bucket**: ✅ 체크 (반드시 체크!)
   - **File size limit**: 5MB (또는 원하는 크기)
   - **Allowed MIME types**: `image/*` (선택사항)
5. **Create bucket** 클릭

**RLS 정책 설정** (자동으로 생성되지만 확인):
- 업로드: 인증된 사용자만 자신의 폴더에 업로드 가능
- 읽기: 모든 사용자 (Public bucket이므로)

### 2. 게시글 이미지용 버킷 (필수)

**버킷 이름**: `post-images` (또는 `avatars`, `profiles` 사용 가능)

**설정 방법**:
1. Supabase 대시보드 접속
2. **Storage** 메뉴 클릭
3. **New bucket** 버튼 클릭
4. 다음 정보 입력:
   - **Name**: `post-images`
   - **Public bucket**: ✅ 체크 (반드시 체크!)
   - **File size limit**: 10MB (또는 원하는 크기)
   - **Allowed MIME types**: `image/*` (선택사항)
5. **Create bucket** 클릭

**RLS 정책 설정**:
- 업로드: 인증된 사용자만 자신의 폴더에 업로드 가능
- 읽기: 모든 사용자 (Public bucket이므로)

## 버킷 우선순위

코드는 다음 순서로 버킷을 시도합니다:

### 프로필 사진:
1. `avatars` 버킷
2. `profiles` 버킷 (fallback)

### 게시글 이미지:
1. `post-images` 버킷
2. `avatars` 버킷 (fallback)
3. `profiles` 버킷 (fallback)

**권장**: 각각의 버킷을 생성하는 것이 좋지만, 하나의 버킷(`avatars`)만 있어도 작동합니다.

## RLS 정책 예시

버킷 생성 후 자동으로 RLS가 활성화되지만, 필요시 수동으로 설정할 수 있습니다:

### 업로드 정책 (인증된 사용자만 자신의 폴더에 업로드)
```sql
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### 읽기 정책 (모든 사용자)
```sql
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

## 문제 해결

### "Bucket not found" 에러
- Supabase 대시보드에서 버킷이 생성되었는지 확인
- 버킷 이름이 정확한지 확인 (대소문자 구분)
- Public bucket으로 설정되었는지 확인

### 업로드 권한 에러
- RLS 정책이 올바르게 설정되었는지 확인
- 사용자가 로그인되어 있는지 확인

### 이미지가 표시되지 않음
- 버킷이 Public으로 설정되었는지 확인
- 이미지 URL이 올바른지 확인
- 브라우저 콘솔에서 CORS 에러 확인

## 테스트

### 프로필 사진 업로드 테스트:
1. 프로필 페이지 접속
2. 프로필 사진 업로드 버튼 클릭
3. 이미지 파일 선택
4. 업로드 성공 확인

### 게시글 이미지 업로드 테스트:
1. 커뮤니티 페이지 접속
2. 글쓰기 버튼 클릭
3. 내용 입력란에 이미지 추가 버튼 클릭 또는 Ctrl+V로 이미지 붙여넣기
4. 이미지가 마크다운 형식으로 삽입되는지 확인
5. 게시글 작성 후 이미지가 표시되는지 확인
