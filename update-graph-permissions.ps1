# Azure AD Permission Update Script for Microsoft Graph Group Lookup
# This script adds the required Microsoft Graph permissions for group name resolution

param(
    [string]$MobileAppName = "Valuations Mobile Tablet App"
)

$ErrorActionPreference = "Stop"

Write-Host "[AZURE AD] Adding Microsoft Graph Group.Read.All Permission" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Green

# Check Azure CLI
try {
    az --version | Out-Null
    Write-Host "[CHECK] Azure CLI is installed" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Azure CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 1: Login to Azure
Write-Host "[STEP 1] Logging in to Azure..." -ForegroundColor Cyan
az login

# Step 2: Get mobile app information
Write-Host "[STEP 2] Finding mobile app registration..." -ForegroundColor Cyan
$MobileClientId = az ad app list --display-name $MobileAppName --query "[0].appId" --output tsv

if ([string]::IsNullOrEmpty($MobileClientId) -or $MobileClientId -eq "null") {
    Write-Host "[ERROR] Mobile app '$MobileAppName' not found." -ForegroundColor Red
    Write-Host "   Please ensure your mobile app is registered in Azure AD with the exact name: '$MobileAppName'" -ForegroundColor Yellow
    exit 1
}

Write-Host "   [SUCCESS] Found mobile app - Client ID: $MobileClientId" -ForegroundColor Green

# Step 3: Add Microsoft Graph Group.Read.All permission
Write-Host "[STEP 3] Adding Microsoft Graph Group.Read.All permission..." -ForegroundColor Cyan

# Microsoft Graph API ID and Group.Read.All permission ID
$GraphApiId = "00000003-0000-0000-c000-000000000000"
$GroupReadAllId = "5b567255-7703-4780-807c-7be8301ae99b"

# Add the permission
az ad app permission add --id $MobileClientId --api $GraphApiId --api-permissions "$GroupReadAllId=Scope"
Write-Host "   [SUCCESS] Microsoft Graph Group.Read.All permission added" -ForegroundColor Green

# Step 4: Grant admin consent
Write-Host "[STEP 4] Granting admin consent for new permission..." -ForegroundColor Cyan
az ad app permission admin-consent --id $MobileClientId
Write-Host "   [SUCCESS] Admin consent granted" -ForegroundColor Green

# Step 5: Verify permissions
Write-Host "[STEP 5] Verifying permissions..." -ForegroundColor Cyan
Write-Host "   Current mobile app permissions:" -ForegroundColor White
az ad app permission list --id $MobileClientId --output table

Write-Host ""
Write-Host "[COMPLETE] Microsoft Graph Permission Added Successfully!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host ""
Write-Host "[NEXT STEPS]" -ForegroundColor Yellow
Write-Host "1. Your mobile app now has Group.Read.All permission" -ForegroundColor White
Write-Host "2. Test the Azure AD authentication in your mobile app" -ForegroundColor White
Write-Host "3. Check console logs for group name resolution" -ForegroundColor White
Write-Host ""
