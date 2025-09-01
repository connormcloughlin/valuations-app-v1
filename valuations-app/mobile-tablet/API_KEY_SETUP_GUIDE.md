# API Key Setup Guide for Expo Builds

## Overview

This guide explains how to set up API keys for your Valuations Mobile Tablet Application using Expo's environment variable system for staging and production builds.

## Prerequisites

- Expo CLI installed
- EAS CLI installed (`npm install -g @expo/eas-cli`)
- Expo account with access to your project
- API keys for your staging and production environments

## Step 1: Create Environment Files

### 1.1 Create Development Environment File

```bash
# Copy the template and create your development environment file
cp env.template .env.development
```

Edit `.env.development` with your development API key:

```env
# API Configuration
API_BASE_URL=https://ca-valuations-api-test.purplebeach-27e5a02b.uksouth.azurecontainerapps.io/api
API_TIMEOUT=45000

# Azure AD Configuration
AZURE_MOBILE_CLIENT_ID=your-azure-mobile-client-id
AZURE_TENANT_ID=your-azure-tenant-id
AZURE_API_CLIENT_ID=your-azure-api-client-id
AZURE_REDIRECT_URI=msauth://com.anonymous.valuationsmobiletablet

# API Key Authentication Configuration
API_KEY=your-development-api-key-here
API_KEY_HEADER_NAME=X-API-Key
USER_CONTEXT_HEADER_NAME=X-User-Context

# Debug Configuration
DEBUG_MODE=true
LOG_LEVEL=debug
```

### 1.2 Create Staging Environment File

```bash
cp env.template .env.staging
```

Edit `.env.staging` with your staging API key:

```env
# API Configuration
API_BASE_URL=https://ca-valuations-api-staging.purplebeach-27e5a02b.uksouth.azurecontainerapps.io/api
API_TIMEOUT=45000

# Azure AD Configuration
AZURE_MOBILE_CLIENT_ID=your-azure-mobile-client-id
AZURE_TENANT_ID=your-azure-tenant-id
AZURE_API_CLIENT_ID=your-azure-api-client-id
AZURE_REDIRECT_URI=msauth://com.anonymous.valuationsmobiletablet

# API Key Authentication Configuration
API_KEY=your-staging-api-key-here
API_KEY_HEADER_NAME=X-API-Key
USER_CONTEXT_HEADER_NAME=X-User-Context

# Debug Configuration
DEBUG_MODE=false
LOG_LEVEL=info
```

### 1.3 Create Production Environment File

```bash
cp env.template .env.production
```

Edit `.env.production` with your production API key:

```env
# API Configuration
API_BASE_URL=https://ca-valuations-api.purplebeach-27e5a02b.uksouth.azurecontainerapps.io/api
API_TIMEOUT=45000

# Azure AD Configuration
AZURE_MOBILE_CLIENT_ID=your-azure-mobile-client-id
AZURE_TENANT_ID=your-azure-tenant-id
AZURE_API_CLIENT_ID=your-azure-api-client-id
AZURE_REDIRECT_URI=msauth://com.anonymous.valuationsmobiletablet

# API Key Authentication Configuration
API_KEY=your-production-api-key-here
API_KEY_HEADER_NAME=X-API-Key
USER_CONTEXT_HEADER_NAME=X-User-Context

# Debug Configuration
DEBUG_MODE=false
LOG_LEVEL=warn
```

## Step 2: Configure EAS Build

### 2.1 Update eas.json

Create or update your `eas.json` file in the project root:

```json
{
  "cli": {
    "version": ">= 5.9.1"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "APP_ENV": "development"
      }
    },
    "staging": {
      "distribution": "internal",
      "env": {
        "APP_ENV": "staging"
      },
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "buildType": "archive"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "APP_ENV": "production"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildType": "archive"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### 2.2 Configure Environment Variables in EAS

Set up environment variables for each build profile:

```bash
# Set development environment variables
eas secret:create --scope project --name APP_ENV --value development --type string

# Set staging environment variables
eas secret:create --scope project --name APP_ENV --value staging --type string

# Set production environment variables
eas secret:create --scope project --name APP_ENV --value production --type string
```

## Step 3: Build Commands

### 3.1 Development Build

```bash
# For local development
APP_ENV=development npx expo start

# For development build
eas build --profile development --platform all
```

### 3.2 Staging Build

```bash
# Build for staging
eas build --profile staging --platform all
```

### 3.3 Production Build

```bash
# Build for production
eas build --profile production --platform all
```

## Step 4: Environment-Specific API Keys

### 4.1 Development API Key
- **Purpose**: Local development and testing
- **Security**: Lower security requirements
- **Access**: Limited to development data
- **Rotation**: Can be rotated frequently

### 4.2 Staging API Key
- **Purpose**: Pre-production testing
- **Security**: Medium security requirements
- **Access**: Staging environment data
- **Rotation**: Rotated before each major release

### 4.3 Production API Key
- **Purpose**: Live production environment
- **Security**: Highest security requirements
- **Access**: Production data
- **Rotation**: Rotated on security schedule

## Step 5: Security Best Practices

### 5.1 API Key Management

1. **Never commit API keys to version control**
   ```bash
   # Add to .gitignore
   echo ".env.*" >> .gitignore
   echo "!.env.template" >> .gitignore
   ```

2. **Use different API keys for each environment**
   - Development: `dev_api_key_123`
   - Staging: `staging_api_key_456`
   - Production: `prod_api_key_789`

3. **Rotate API keys regularly**
   - Development: Monthly
   - Staging: Before each release
   - Production: Quarterly or on security events

### 5.2 Environment Variable Security

1. **Use EAS secrets for sensitive data**
   ```bash
   # Store API key as secret
   eas secret:create --scope project --name API_KEY --value your-api-key --type string
   ```

2. **Limit access to production keys**
   - Only authorized team members
   - Use secure key management systems
   - Monitor key usage

## Step 6: Testing Your Setup

### 6.1 Verify Environment Loading

Add this to your app to verify the correct environment is loaded:

```javascript
// In your app startup
import Constants from 'expo-constants';

console.log('🔧 Environment Debug:');
console.log('🔧 APP_ENV:', process.env.APP_ENV);
console.log('🔧 API_KEY configured:', !!Constants.expoConfig?.extra?.apiKey);
console.log('🔧 API_BASE_URL:', Constants.expoConfig?.extra?.apiBaseUrl);
```

### 6.2 Test API Key Authentication

```javascript
// Test API key authentication
import { isApiKeyMode, validateApiKeyConfig } from './constants/apiConfig';

console.log('🔑 API Key Mode:', isApiKeyMode());
console.log('🔑 Config Valid:', validateApiKeyConfig());
```

## Step 7: Troubleshooting

### 7.1 Common Issues

1. **Environment not loading**
   ```bash
   # Check if environment file exists
   ls -la .env.*
   
   # Verify APP_ENV is set
   echo $APP_ENV
   ```

2. **API key not found**
   ```bash
   # Check if API key is in environment file
   grep API_KEY .env.development
   
   # Verify in app config
   npx expo config --type introspect
   ```

3. **Build fails with missing variables**
   ```bash
   # Check EAS secrets
   eas secret:list
   
   # Recreate secret if needed
   eas secret:delete --name API_KEY
   eas secret:create --scope project --name API_KEY --value your-api-key --type string
   ```

### 7.2 Debug Commands

```bash
# Check current environment
echo $APP_ENV

# List all environment files
ls -la .env.*

# Verify EAS configuration
eas build:configure

# Check build status
eas build:list
```

## Step 8: Deployment Checklist

Before deploying to production:

- [ ] API keys are different for each environment
- [ ] Production API key has minimal required permissions
- [ ] Environment files are not committed to git
- [ ] EAS secrets are properly configured
- [ ] Build profiles are correctly set up
- [ ] API key rotation schedule is established
- [ ] Monitoring is in place for API key usage
- [ ] Team access to production keys is limited

## Step 9: Monitoring and Maintenance

### 9.1 API Key Usage Monitoring

- Monitor API key usage in your backend logs
- Set up alerts for unusual usage patterns
- Track API key rotation dates
- Monitor for unauthorized access attempts

### 9.2 Regular Maintenance

- Monthly: Review and rotate development keys
- Quarterly: Review and rotate production keys
- Before releases: Rotate staging keys
- On security events: Immediate rotation of affected keys

## Support

If you encounter issues with API key setup:

1. Check the troubleshooting section above
2. Verify your environment configuration
3. Test with a simple API call
4. Check Expo and EAS documentation
5. Contact your backend team for API key issues

## Security Notes

- **Never share API keys in chat or email**
- **Use secure channels for key distribution**
- **Monitor key usage regularly**
- **Rotate keys on security events**
- **Limit key permissions to minimum required**
- **Use different keys for different environments**

