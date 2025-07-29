# PowerShell script to filter Android logs and remove InputMethodManager noise
# Usage: adb logcat | .\filter-android-logs.ps1

param(
    [string]$Filter = "InputMethodManager"
)

Write-Host "🔧 Filtering Android logs to remove $Filter noise..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop filtering" -ForegroundColor Yellow
Write-Host ""

try {
    # Read from stdin and filter out InputMethodManager logs
    $input | Where-Object { 
        $_ -notmatch $Filter 
    } | ForEach-Object {
        Write-Host $_
    }
} catch {
    Write-Host "❌ Error filtering logs: $($_.Exception.Message)" -ForegroundColor Red
} 