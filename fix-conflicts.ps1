# 충돌 마커 자동 제거 스크립트 (HEAD 버전 우선)
Write-Host "충돌 마커 제거 시작..." -ForegroundColor Yellow

$files = Get-ChildItem -Recurse -File -Include *.ts,*.tsx,*.js,*.jsx,*.json,*.md,*.sql | Where-Object { 
    $_.FullName -notmatch 'node_modules|\.git|dist|build|fix-conflicts\.ps1' 
}

$fixedCount = 0

foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
        if ($content -and $content -match '<<<<<<< HEAD') {
            # HEAD 버전(로컬)을 우선으로 선택
            # 패턴 1: <<<<<<< HEAD\n...\n=======\n...\n>>>>>>> ...\n
            $newContent = $content -replace '(?s)<<<<<<< HEAD\r?\n(.*?)\r?\n=======\r?\n.*?\r?\n>>>>>>> [^\r\n]+\r?\n', '$1'
            
            # 패턴 2: 남은 마커들 제거
            $newContent = $newContent -replace '<<<<<<< HEAD\r?\n', '' `
                                     -replace '=======\r?\n', '' `
                                     -replace '>>>>>>> [^\r\n]+\r?\n', ''
            
            # UTF-8 (BOM 없음)로 저장
            $utf8NoBom = New-Object System.Text.UTF8Encoding $false
            [System.IO.File]::WriteAllText($file.FullName, $newContent, $utf8NoBom)
            Write-Host "Fixed: $($file.Name)" -ForegroundColor Green
            $fixedCount++
        }
    } catch {
        Write-Host "Error processing $($file.Name): $_" -ForegroundColor Red
    }
}

Write-Host "`n총 $fixedCount 개 파일 수정 완료." -ForegroundColor Cyan
Write-Host "빌드를 테스트하세요: npm run build" -ForegroundColor Yellow

