# Comprehensive Android log filtering script
# Usage: adb logcat | .\filter-logs.ps1

param(
    [switch]$ShowAll,
    [switch]$ShowErrors,
    [switch]$ShowWarnings,
    [string]$AppName = "valuationsmobiletablet"
)

Write-Host "🔧 Android Log Filter" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "App: $AppName" -ForegroundColor Cyan
Write-Host "Show All: $ShowAll" -ForegroundColor Cyan
Write-Host "Show Errors: $ShowErrors" -ForegroundColor Cyan
Write-Host "Show Warnings: $ShowWarnings" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop filtering" -ForegroundColor Yellow
Write-Host ""

try {
    $input | Where-Object { 
        $line = $_
        
        # Skip InputMethodManager noise
        if ($line -match "InputMethodManager") {
            return $false
        }
        
        # Skip other common Android system noise
        if ($line -match "ActivityManager|PackageManager|WindowManager|ViewRootImpl") {
            return $false
        }
        
        # Show app-specific logs
        if ($line -match $AppName) {
            return $true
        }
        
        # Show React Native logs
        if ($line -match "ReactNativeJS|ReactNative") {
            return $true
        }
        
        # Show Expo logs
        if ($line -match "ExpoModulesCore|Expo") {
            return $true
        }
        
        # Show errors if requested
        if ($ShowErrors -and $line -match "ERROR|Error|Exception|FATAL") {
            return $true
        }
        
        # Show warnings if requested
        if ($ShowWarnings -and $line -match "WARN|Warning") {
            return $true
        }
        
        # Show all if requested
        if ($ShowAll) {
            return $true
        }
        
        return $false
    } | ForEach-Object {
        # Color code different log levels
        if ($_ -match "ERROR|Error|Exception|FATAL") {
            Write-Host $_ -ForegroundColor Red
        } elseif ($_ -match "WARN|Warning") {
            Write-Host $_ -ForegroundColor Yellow
        } elseif ($_ -match "ReactNativeJS") {
            Write-Host $_ -ForegroundColor Cyan
        } else {
            Write-Host $_
        }
    }
} catch {
    Write-Host "❌ Error filtering logs: $($_.Exception.Message)" -ForegroundColor Red
} 