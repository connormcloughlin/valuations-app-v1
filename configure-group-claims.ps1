# Azure AD Group Claims Configuration Script
# This script configures Azure AD to include group names in tokens instead of GUIDs

param(
    [string]$MobileAppName = "Valuations Mobile Tablet App",
    [string]$ApiAppName = "Valuations API"
)

$ErrorActionPreference = "Stop"

Write-Host "[AZURE AD] Configuring Group Claims in Token Configuration" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green

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

# Step 2: Get app information
Write-Host "[STEP 2] Finding app registrations..." -ForegroundColor Cyan

$MobileClientId = az ad app list --display-name $MobileAppName --query "[0].appId" --output tsv
$ApiClientId = az ad app list --display-name $ApiAppName --query "[0].appId" --output tsv

if ([string]::IsNullOrEmpty($MobileClientId) -or $MobileClientId -eq "null") {
    Write-Host "[ERROR] Mobile app '$MobileAppName' not found." -ForegroundColor Red
    exit 1
}

if ([string]::IsNullOrEmpty($ApiClientId) -or $ApiClientId -eq "null") {
    Write-Host "[ERROR] API app '$ApiAppName' not found." -ForegroundColor Red
    exit 1
}

Write-Host "   [SUCCESS] Found mobile app - Client ID: $MobileClientId" -ForegroundColor Green
Write-Host "   [SUCCESS] Found API app - Client ID: $ApiClientId" -ForegroundColor Green

# Step 3: Configure group claims for mobile app
Write-Host "[STEP 3] Configuring group claims for mobile app..." -ForegroundColor Cyan

# Configure group claims to include display names instead of GUIDs
$groupClaimsConfig = @"
{
  "groupMembershipClaims": "SecurityGroup",
  "optionalClaims": {
    "idToken": [
      {
        "name": "groups",
        "source": null,
        "essential": false,
        "additionalProperties": ["sam_account_name", "dns_domain_and_sam_account_name"]
      }
    ],
    "accessToken": [
      {
        "name": "groups",
        "source": null,
        "essential": false,
        "additionalProperties": ["sam_account_name", "dns_domain_and_sam_account_name"]
      }
    ],
    "saml2Token": []
  }
}
"@

# Apply the configuration to mobile app
az ad app update --id $MobileClientId --set groupMembershipClaims=SecurityGroup
Write-Host "   [SUCCESS] Group membership claims enabled for mobile app" -ForegroundColor Green

# Step 4: Configure group claims for API app
Write-Host "[STEP 4] Configuring group claims for API app..." -ForegroundColor Cyan

# Apply the same configuration to API app
az ad app update --id $ApiClientId --set groupMembershipClaims=SecurityGroup
Write-Host "   [SUCCESS] Group membership claims enabled for API app" -ForegroundColor Green

# Step 5: Configure optional claims for group names
Write-Host "[STEP 5] Adding optional claims for group display names..." -ForegroundColor Cyan

# Create optional claims configuration file
$OptionalClaimsJson = @"
{
  "idToken": [
    {
      "name": "groups",
      "source": null,
      "essential": false,
      "additionalProperties": ["sam_account_name", "dns_domain_and_sam_account_name"]
    }
  ],
  "accessToken": [
    {
      "name": "groups", 
      "source": null,
      "essential": false,
      "additionalProperties": ["sam_account_name", "dns_domain_and_sam_account_name"]
    }
  ]
}
"@

# Save to temporary file
$TempFile = [System.IO.Path]::GetTempFileName()
$OptionalClaimsJson | Out-File -FilePath $TempFile -Encoding UTF8

try {
    # Apply optional claims to mobile app
    az ad app update --id $MobileClientId --optional-claims "@$TempFile"
    Write-Host "   [SUCCESS] Optional claims configured for mobile app" -ForegroundColor Green
    
    # Apply optional claims to API app
    az ad app update --id $ApiClientId --optional-claims "@$TempFile"
    Write-Host "   [SUCCESS] Optional claims configured for API app" -ForegroundColor Green
} finally {
    # Clean up temp file
    Remove-Item $TempFile -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "[COMPLETE] Group Claims Configuration Complete!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "[IMPORTANT NOTES]" -ForegroundColor Yellow
Write-Host "1. Group claims are now configured to include group names" -ForegroundColor White
Write-Host "2. You may need to wait a few minutes for changes to take effect" -ForegroundColor White  
Write-Host "3. Test authentication to verify group names appear in tokens" -ForegroundColor White
Write-Host "4. Groups will now appear as 'DOMAIN\GroupName' format in tokens" -ForegroundColor White
Write-Host ""
Write-Host "[NEXT STEPS]" -ForegroundColor Yellow
Write-Host "1. Test Azure AD authentication in your mobile app" -ForegroundColor White
Write-Host "2. Check console logs for group names instead of GUIDs" -ForegroundColor White
Write-Host "3. If issues persist, check Azure AD Portal > App registrations > Token configuration" -ForegroundColor White
Write-Host "" 