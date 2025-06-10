# Azure AD Configuration Script for Valuations App (PowerShell)
# This script automates the complete Azure AD setup for mobile authentication

param(
    [string]$ApiAppName = "Valuations API",
    [string]$MobileAppName = "Valuations Mobile Tablet App", 
    [string]$RedirectUri = "msauth://com.qantam.valuations/auth"
)

# Configuration
$ErrorActionPreference = "Stop"

Write-Host "[AZURE AD] Configuration Script for Valuations App" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Green

# File paths
$MobileEnvPath = "valuations-app\mobile-tablet\.env"
$BackendEnvPath = "valuations-app\backend\.env"

# Function to update mobile .env file
function Update-MobileEnv {
    param(
        [string]$FilePath,
        [string]$MobileClientId,
        [string]$TenantId,
        [string]$ApiClientId,
        [string]$RedirectUri
    )
    
    Write-Host "[MOBILE] Updating mobile app .env file: $FilePath" -ForegroundColor Yellow
    
    # Create backup if file exists
    if (Test-Path $FilePath) {
        $BackupPath = "$FilePath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item $FilePath $BackupPath
        Write-Host "   [BACKUP] Created: $BackupPath" -ForegroundColor Gray
    }
    
    # Create directory if it doesn't exist
    $Directory = Split-Path $FilePath -Parent
    if (-not (Test-Path $Directory)) {
        New-Item -ItemType Directory -Path $Directory -Force | Out-Null
    }
    
    # Create new .env content
    $Content = @"
# Azure AD Configuration for Mobile App
AZURE_MOBILE_CLIENT_ID=$MobileClientId
AZURE_TENANT_ID=$TenantId
AZURE_API_CLIENT_ID=$ApiClientId
AZURE_REDIRECT_URI=$RedirectUri

# API Configuration
API_BASE_URL=https://yourdomain.com/api
API_TIMEOUT=30000

# Development/Debug Settings
DEBUG_MODE=false
LOG_LEVEL=info
"@
    
    # Write content to file
    $Content | Out-File -FilePath $FilePath -Encoding UTF8
    Write-Host "   [SUCCESS] Mobile .env updated successfully" -ForegroundColor Green
}

# Function to update backend .env file
function Update-BackendEnv {
    param(
        [string]$FilePath,
        [string]$TenantId,
        [string]$ApiClientId,
        [string]$ClientSecret,
        [string]$MobileClientId
    )
    
    Write-Host "[BACKEND] Updating backend .env file: $FilePath" -ForegroundColor Yellow
    
    # Create backup if file exists
    if (Test-Path $FilePath) {
        $BackupPath = "$FilePath.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item $FilePath $BackupPath
        Write-Host "   [BACKUP] Created: $BackupPath" -ForegroundColor Gray
    }
    
    # Create directory if it doesn't exist
    $Directory = Split-Path $FilePath -Parent
    if (-not (Test-Path $Directory)) {
        New-Item -ItemType Directory -Path $Directory -Force | Out-Null
    }
    
    # Create new .env content
    $Content = @"
# Azure AD Configuration
AZURE_TENANT_ID=$TenantId
AZURE_CLIENT_ID=$ApiClientId
AZURE_CLIENT_SECRET=$ClientSecret
AZURE_MOBILE_CLIENT_ID=$MobileClientId

# API Configuration
API_PORT=443
API_HOST=0.0.0.0
ALLOWED_ORIGINS=https://yourdomain.com,https://localhost:3000

# SSL Certificate paths (for local development)
SSL_CERT_PATH=./ssl/localhost.crt
SSL_KEY_PATH=./ssl/localhost.key

# Database Configuration
# DATABASE_URL=your-database-connection-string
# DB_USER=your-db-username
# DB_PASSWORD=your-db-password
# DB_SERVER=your-db-server
# DB_NAME=your-db-name

# Logging
LOG_LEVEL=info
NODE_ENV=development
"@
    
    # Write content to file
    $Content | Out-File -FilePath $FilePath -Encoding UTF8
    Write-Host "   [SUCCESS] Backend .env updated successfully" -ForegroundColor Green
}

# Check if Azure CLI is installed
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

# Step 2: Get tenant information
Write-Host "[STEP 2] Getting tenant information..." -ForegroundColor Cyan
$TenantId = az account show --query tenantId --output tsv
Write-Host "   Tenant ID: $TenantId" -ForegroundColor White

# Step 3: Check for existing API app
Write-Host "[STEP 3] Checking for existing API app registration..." -ForegroundColor Cyan
$ApiClientId = az ad app list --display-name $ApiAppName --query "[0].appId" --output tsv

if ([string]::IsNullOrEmpty($ApiClientId) -or $ApiClientId -eq "null") {
    Write-Host "[ERROR] API app '$ApiAppName' not found." -ForegroundColor Red
    Write-Host "   Please ensure your API app is registered in Azure AD with the exact name: '$ApiAppName'" -ForegroundColor Yellow
    exit 1
}

Write-Host "   [SUCCESS] Found API app - Client ID: $ApiClientId" -ForegroundColor Green

# Step 4: Create mobile app registration
Write-Host "[STEP 4] Creating mobile app registration..." -ForegroundColor Cyan
az ad app create --display-name $MobileAppName --public-client-redirect-uris $RedirectUri --sign-in-audience "AzureADMyOrg" --enable-access-token-issuance true --enable-id-token-issuance true | Out-Null

$MobileClientId = az ad app list --display-name $MobileAppName --query "[0].appId" --output tsv
Write-Host "   [SUCCESS] Mobile app created - Client ID: $MobileClientId" -ForegroundColor Green

# Step 5: Set up API identifier URI
Write-Host "[STEP 5] Setting up API identifier URI..." -ForegroundColor Cyan
az ad app update --id $ApiClientId --identifier-uris "api://$ApiClientId"
Write-Host "   [SUCCESS] API identifier URI set to: api://$ApiClientId" -ForegroundColor Green

# Step 6: Add access_as_user scope
Write-Host "[STEP 6] Adding access_as_user scope to API..." -ForegroundColor Cyan

# Generate a new GUID for the scope
$ScopeId = [System.Guid]::NewGuid().ToString()

# Create the scope JSON
$ScopeJson = @"
[
  {
    "id": "$ScopeId",
    "isEnabled": true,
    "type": "User",
    "adminConsentDescription": "Allow the app to access valuations data on behalf of the user",
    "adminConsentDisplayName": "Access valuations data",
    "userConsentDescription": "Allow the app to access your valuations data",
    "userConsentDisplayName": "Access your valuations data",
    "value": "access_as_user"
  }
]
"@

az ad app update --id $ApiClientId --set "api.oauth2PermissionScopes=$ScopeJson"
Write-Host "   [SUCCESS] Scope 'access_as_user' added with ID: $ScopeId" -ForegroundColor Green

# Step 7: Configure mobile app permissions
Write-Host "[STEP 7] Configuring mobile app permissions..." -ForegroundColor Cyan

# Add API permission to mobile app
az ad app permission add --id $MobileClientId --api $ApiClientId --api-permissions "$ScopeId=Scope"
Write-Host "   [SUCCESS] Permission added to mobile app" -ForegroundColor Green

# Step 8: Grant admin consent
Write-Host "[STEP 8] Granting admin consent..." -ForegroundColor Cyan
az ad app permission admin-consent --id $MobileClientId
Write-Host "   [SUCCESS] Admin consent granted" -ForegroundColor Green

# Step 9: Create API client secret
Write-Host "[STEP 9] Creating API client secret..." -ForegroundColor Cyan
$SecretOutput = az ad app credential reset --id $ApiClientId --credential-description "Backend API Secret" --years 2 | ConvertFrom-Json
$ClientSecret = $SecretOutput.password
Write-Host "   [SUCCESS] Client secret created" -ForegroundColor Green

# Step 10: Update .env files
Write-Host "[UPDATE] Updating environment files..." -ForegroundColor Cyan

# Update mobile app .env file
if (Test-Path "valuations-app\mobile-tablet") {
    Update-MobileEnv -FilePath $MobileEnvPath -MobileClientId $MobileClientId -TenantId $TenantId -ApiClientId $ApiClientId -RedirectUri $RedirectUri
} else {
    Write-Host "   [WARNING] Mobile tablet directory not found: valuations-app\mobile-tablet" -ForegroundColor Yellow
    Write-Host "   [INFO] Mobile .env content saved to: mobile-app.env" -ForegroundColor Yellow
    Update-MobileEnv -FilePath "mobile-app.env" -MobileClientId $MobileClientId -TenantId $TenantId -ApiClientId $ApiClientId -RedirectUri $RedirectUri
}

# Update backend .env file
if (Test-Path "valuations-app\backend") {
    Update-BackendEnv -FilePath $BackendEnvPath -TenantId $TenantId -ApiClientId $ApiClientId -ClientSecret $ClientSecret -MobileClientId $MobileClientId
} else {
    Write-Host "   [WARNING] Backend directory not found: valuations-app\backend" -ForegroundColor Yellow
    Write-Host "   [INFO] Backend .env content saved to: backend-api.env" -ForegroundColor Yellow
    Update-BackendEnv -FilePath "backend-api.env" -TenantId $TenantId -ApiClientId $ApiClientId -ClientSecret $ClientSecret -MobileClientId $MobileClientId
}

# Step 11: Verify configuration
Write-Host "[VERIFY] Verifying configuration..." -ForegroundColor Cyan
Write-Host "   Mobile app permissions:" -ForegroundColor White
az ad app permission list --id $MobileClientId --output table

Write-Host ""
Write-Host "[COMPLETE] AZURE AD CONFIGURATION COMPLETE!" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "[SUCCESS] Environment files have been automatically updated!" -ForegroundColor Green
Write-Host ""
Write-Host "[SUMMARY] Configuration Summary:" -ForegroundColor White
Write-Host "   Mobile App Client ID: $MobileClientId" -ForegroundColor White
Write-Host "   API Client ID: $ApiClientId" -ForegroundColor White
Write-Host "   Tenant ID: $TenantId" -ForegroundColor White
Write-Host "   Client Secret: [SAVED TO .env FILES]" -ForegroundColor White
Write-Host ""
Write-Host "[FILES] Files Updated:" -ForegroundColor White

if (Test-Path $MobileEnvPath) {
    Write-Host "   [SUCCESS] $MobileEnvPath (backup created)" -ForegroundColor Green
} else {
    Write-Host "   [SUCCESS] mobile-app.env (mobile directory not found)" -ForegroundColor Green
}

if (Test-Path $BackendEnvPath) {
    Write-Host "   [SUCCESS] $BackendEnvPath (backup created)" -ForegroundColor Green
} else {
    Write-Host "   [SUCCESS] backend-api.env (backend directory not found)" -ForegroundColor Green
}

Write-Host ""
Write-Host "[SECURITY] IMPORTANT SECURITY NOTES:" -ForegroundColor Yellow
Write-Host "* Client secret has been saved to your .env files" -ForegroundColor Yellow
Write-Host "* Backup files created with timestamp" -ForegroundColor Yellow
Write-Host "* Never commit .env files to version control" -ForegroundColor Yellow
Write-Host "* The client secret expires in 2 years - set a calendar reminder" -ForegroundColor Yellow
Write-Host ""
Write-Host "[NEXT] Next steps:" -ForegroundColor White
Write-Host "1. [DONE] Environment variables are configured" -ForegroundColor Green
Write-Host "2. Install mobile dependencies: cd valuations-app\mobile-tablet && npm install @azure/msal-react-native react-native-keychain" -ForegroundColor White
Write-Host "3. Install backend dependencies: cd valuations-app\backend && npm install passport-azure-ad cors helmet" -ForegroundColor White
Write-Host "4. Update API_BASE_URL in mobile .env with your actual domain" -ForegroundColor White
Write-Host "5. Add database configuration to backend .env if needed" -ForegroundColor White
Write-Host "6. Implement the authentication code from the implementation plan" -ForegroundColor White
Write-Host ""
Write-Host "[COMPLETE] Azure AD setup is complete and .env files are ready!" -ForegroundColor Green 