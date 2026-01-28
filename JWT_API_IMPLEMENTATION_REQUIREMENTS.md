# JWT API Implementation Requirements

## Overview
This document outlines the server-side JWT authentication endpoints required to achieve SEC-01 compliance and eliminate API key vulnerabilities in the Valuations Mobile App.

## Security Context
- **Current Issue**: SEC-01 - Hard-coded API key authentication with no rotation & exposed in build
- **Target**: Replace API key authentication with secure JWT tokens
- **Compliance**: SEC-REC-01 - Replace static API key mode with short-lived bearer tokens

---

## Required Endpoints

### 1. POST /auth/login
**Purpose**: Authenticate users with email/password and issue JWT tokens

**Request:**
```json
{
  "email": "user@example.com",
  "password": "userpassword"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Surveyor",
    "roles": ["Surveyor", "Admin"]
  },
  "expiresIn": 86400
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

### 2. POST /auth/azure-exchange
**Purpose**: Exchange Azure AD tokens for JWT tokens

**Request:**
```json
{
  "azureToken": "azure-access-token-here"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "azure-user-123",
    "email": "user@company.com",
    "name": "Azure User",
    "role": "Surveyor",
    "roles": ["Surveyor"]
  },
  "expiresIn": 86400
}
```

**Response (Error - 401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_AZURE_TOKEN",
    "message": "Azure token is invalid or expired"
  }
}
```

### 3. GET /auth/verify
**Purpose**: Verify JWT token validity (existing endpoint, update for JWT)

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (Valid Token - 200):**
```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Surveyor",
    "roles": ["Surveyor"]
  }
}
```

**Response (Invalid Token - 401):**
```json
{
  "success": false,
  "valid": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "JWT token is invalid or expired"
  }
}
```

---

## JWT Token Requirements

### Token Structure
```json
{
  "header": {
    "alg": "RS256",
    "typ": "JWT",
    "kid": "key-id-1"
  },
  "payload": {
    "sub": "user-123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "Surveyor",
    "roles": ["Surveyor", "Admin"],
    "iat": 1640995200,
    "exp": 1641081600,
    "iss": "https://ca-valuations-api-test.purplebeach-27e5a02b.uksouth.azurecontainerapps.io",
    "aud": "valuations-mobile-app"
  }
}
```

### Required Claims
- **sub**: User ID (string)
- **email**: User email (string)
- **name**: User display name (string)
- **role**: Primary role (string)
- **roles**: Array of user roles (string[])
- **iat**: Issued at timestamp (number)
- **exp**: Expiration timestamp (number)
- **iss**: Issuer (string) - Your API base URL
- **aud**: Audience (string) - "valuations-mobile-app"

### Token Configuration
- **Algorithm**: RS256 (RSA with SHA-256)
- **Expiration**: 24 hours (86400 seconds)
- **Issuer**: Your API base URL
- **Audience**: "valuations-mobile-app"

---

## Security Requirements

### 1. JWT Signing
- **Algorithm**: RS256 (RSA with SHA-256)
- **Key Size**: 2048-bit minimum
- **Key Rotation**: Implement key rotation strategy
- **Private Key**: Store securely, never expose
- **Public Key**: Expose via JWKS endpoint

### 2. JWKS Endpoint (Optional but Recommended)
**GET /.well-known/jwks.json**
```json
{
  "keys": [
    {
      "kty": "RSA",
      "kid": "key-id-1",
      "use": "sig",
      "alg": "RS256",
      "n": "base64-encoded-modulus",
      "e": "AQAB"
    }
  ]
}
```

### 3. Token Validation
- Verify signature using public key
- Validate all required claims
- Check expiration (exp)
- Verify issuer (iss)
- Verify audience (aud)
- Validate user exists and is active

### 4. Error Handling
- Return consistent error format
- Include correlation IDs for debugging
- Log security events (invalid tokens, failed logins)
- Rate limiting on authentication endpoints

---

## Implementation Steps

### Phase 1: Basic JWT Implementation
1. **Install JWT Library**: Use `jsonwebtoken` or similar
2. **Generate RSA Key Pair**: 2048-bit minimum
3. **Implement /auth/login**: Email/password authentication
4. **Implement /auth/azure-exchange**: Azure AD token exchange
5. **Update /auth/verify**: JWT token validation
6. **Test with Mobile App**: Ensure tokens work

### Phase 2: Security Hardening
1. **Implement JWKS Endpoint**: For key rotation
2. **Add Rate Limiting**: Prevent brute force attacks
3. **Add Logging**: Security event logging
4. **Key Rotation**: Implement key rotation strategy
5. **Token Blacklisting**: For logout/revocation

### Phase 3: Production Readiness
1. **Load Testing**: Ensure performance under load
2. **Security Audit**: Third-party security review
3. **Monitoring**: Token usage and error monitoring
4. **Documentation**: API documentation updates

---

## Testing Requirements

### Unit Tests
- JWT token generation
- JWT token validation
- Error handling
- Claim validation

### Integration Tests
- Authentication flow
- Token exchange
- Error scenarios
- Rate limiting

### Security Tests
- Invalid token handling
- Expired token handling
- Malformed token handling
- Brute force protection

---

## Migration Strategy

### Current State
- API key authentication
- Hard-coded API keys in build
- No token rotation

### Target State
- JWT token authentication
- Server-issued tokens
- Automatic token rotation
- Secure token storage

### Migration Steps
1. **Implement JWT endpoints** (this document)
2. **Update mobile app** to use JWT authentication
3. **Remove API key logic** from mobile app
4. **Deploy and test** in staging environment
5. **Production deployment** with monitoring

---

## Security Benefits

### SEC-01 Compliance
- ✅ Eliminates hard-coded API keys
- ✅ Implements token rotation
- ✅ Removes API key exposure from build
- ✅ Adds proper signature verification

### Additional Security
- ✅ Short-lived tokens (24 hours)
- ✅ Proper token validation
- ✅ User context in tokens
- ✅ Role-based access control
- ✅ Audit trail for authentication

---

## Contact Information

**API Team Lead**: [Your Name]
**Security Team**: [Security Team Contact]
**Mobile Team**: [Mobile Team Contact]

**Timeline**: [Specify deadline for implementation]
**Priority**: P0 (Critical for SEC-01 compliance)

---

## References

- [JWT RFC 7519](https://tools.ietf.org/html/rfc7519)
- [JWT Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-jwt-bcp)
- [SEC-01 Security Finding](SECURITY_AUDIT.md#sec-01)
- [SEC-REC-01 Recommendation](SECURITY_AUDIT.md#sec-rec-01)
