$routes = Get-ChildItem -Path src\app\api -Filter route.ts -Recurse
foreach ($file in $routes) {
    try {
        $filePath = $file.FullName
        $lines = Get-Content -LiteralPath $filePath
        $content = $lines -join "`n"
        if ($content -notmatch "export const dynamic = 'force-dynamic';") {
            $newContent = "export const dynamic = 'force-dynamic';`n" + $content
            Set-Content -LiteralPath $filePath $newContent
            Write-Host "Updated: $filePath"
        }
    } catch {
        Write-Host "Error processing: $($file.FullName)"
        Write-Host $_.Exception.Message
    }
}
