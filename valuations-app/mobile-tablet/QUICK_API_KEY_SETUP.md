# Quick API Key Setup Guide

## 🚨 **CURRENT ISSUE: User Context Missing**

The logs show that API key authentication is failing because **user context is missing from AsyncStorage**. This happens when:

1. **User hasn't logged in yet**
2. **Login process didn't store user context properly**
3. **App was restarted and user context wasn't restored**

## 🔧 **Immediate Fix Steps**

### Step 1: Verify API Key Configuration

First, check if your API key is properly configured:

```bash
# Check your .env.development file
cat .env.development
```

Make sure it contains:
```env
API_KEY=your-actual-api-key-here
API_BASE_URL=http://192.168.0.105:5000/api
```

### Step 2: Login to the App

1. **Open the app** in your development environment
2. **Login with Azure AD** or use the mock login
3. **Check the console logs** for user context setup messages

### Step 3: Manual User Context Setup (If Needed)

If login doesn't work, you can manually set up user context for testing:

```bash
# Run the manual setup script
node setup-user-context.js
```

### Step 4: Verify Setup

Run the debug script to verify everything is working:

```bash
# Run the debug script
node debug-api-key.js
```

## 📋 **Environment Files Setup**

### 1. Create Environment Files

```bash
# In your project root
cp env.template .env.development
cp env.template .env.staging  
cp env.template .env.production
```

### 2. Edit Environment Files

**`.env.development`:**
```env
API_KEY=your-dev-api-key
API_BASE_URL=http://192.168.0.105:5000/api
```

**`.env.staging`:**
```env
API_KEY=your-staging-api-key
API_BASE_URL=https://ca-valuations-api-staging.purplebeach-27e5a02b.uksouth.azurecontainerapps.io/api
```

**`.env.production`:**
```env
API_KEY=your-production-api-key
API_BASE_URL=https://ca-valuations-api.purplebeach-27e5a02b.uksouth.azurecontainerapps.io/api
```

### 3. Create/Update eas.json

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
        "API_KEY": "your-dev-api-key",
        "API_BASE_URL": "http://192.168.0.105:5000/api"
      }
    },
    "staging": {
      "distribution": "internal",
      "env": {
        "API_KEY": "your-staging-api-key",
        "API_BASE_URL": "https://ca-valuations-api-staging.purplebeach-27e5a02b.uksouth.azurecontainerapps.io/api"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "API_KEY": "your-production-api-key",
        "API_BASE_URL": "https://ca-valuations-api.purplebeach-27e5a02b.uksouth.azurecontainerapps.io/api"
      }
    }
  }
}
```

### 4. Add to .gitignore

```bash
echo ".env.*" >> .gitignore
echo "!.env.template" >> .gitignore
```

### 5. Build Commands

```bash
# Development
APP_ENV=development npx expo start

# Staging build
eas build --profile staging --platform all

# Production build  
eas build --profile production --platform all
```

## What You Need from Your Backend Team

1. **Development API Key** - for local development
2. **Staging API Key** - for pre-production testing
3. **Production API Key** - for live app
4. **API Base URLs** for each environment
5. **API Key Header Name** (default: `X-API-Key`)
6. **User Context Header Name** (default: `X-User-Context`)

## Security Checklist

- [ ] Different API keys for each environment
- [ ] Environment files not committed to git
- [ ] Production key has minimal permissions
- [ ] Key rotation schedule established
- [ ] Team access to production keys limited

## Test Your Setup

```javascript
// Add this to your app startup to verify
import Constants from 'expo-constants';

console.log('🔧 Environment:', process.env.APP_ENV);
console.log('🔧 API Key configured:', !!Constants.expoConfig?.extra?.apiKey);
console.log('🔧 Base URL:', Constants.expoConfig?.extra?.apiBaseUrl);
```

## 🔍 **Troubleshooting**

### If API Key is Missing:
1. Check your `.env.development` file exists
2. Verify `API_KEY` is set correctly
3. Restart the development server

### If User Context is Missing:
1. Login to the app first
2. Check console logs for user context setup
3. Use the manual setup script if needed
4. Verify AsyncStorage has user context data

### If Still Getting 401 Errors:
1. Verify your API key is valid
2. Check that your backend supports API key authentication
3. Ensure user context contains valid user information

### Environment not loading?
```bash
echo $APP_ENV
ls -la .env.*
```

### Build fails?
```bash
eas build:configure
eas secret:list
```

### API key not working?
```bash
npx expo config --type introspect
```
