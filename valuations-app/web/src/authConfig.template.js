/**
 * Template authentication configuration
 * Copy this file to authConfig.js and fill in your actual values
 */

export const msalConfig = {
    auth: {
        clientId: "YOUR_AZURE_AD_CLIENT_ID",
        authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
        redirectUri: "http://localhost:3000/login",
        postLogoutRedirectUri: "http://localhost:3000/login",
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    }
};

export const loginRequest = {
    scopes: ["User.Read", "openid", "profile", "email"]
};

export const protectedResources = {
    apiEndpoint: "http://localhost:5000/api",
    scopes: {
        read: ["api://YOUR_API_SCOPE_ID/read"],
        write: ["api://YOUR_API_SCOPE_ID/write"]
    }
}; 