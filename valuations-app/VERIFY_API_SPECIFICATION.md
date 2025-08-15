# Token Verification API Specification

## Overview
The token verification API endpoint provides a way to validate JWT tokens and retrieve current user information. This endpoint is crucial for maintaining secure authentication state and validating tokens on the client side.

## Endpoint Details

### Base URL
```
GET /api/auth/verify
```

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Request Format

The endpoint doesn't accept any request body. The JWT token should be provided in the Authorization header using the Bearer scheme.

### Example Request
```http
GET /api/auth/verify
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

## Response Format

### Success Response (200 OK)
When the token is valid, the endpoint returns user information along with the validation status.

```json
{
  "valid": true,
  "user": {
    "id": "user_id",
    "name": "User Name",
    "email": "user@example.com",
    "role": "user_role"
  }
}
```

### Invalid Token Response (401 Unauthorized)
When the token is invalid or expired.

```json
{
  "valid": false,
  "message": "Invalid token",
  "code": "INVALID_TOKEN"
}
```

### Missing Token Response (401 Unauthorized)
When no token is provided in the Authorization header.

```json
{
  "valid": false,
  "message": "No token provided",
  "code": "NO_TOKEN"
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `NO_TOKEN` | No JWT token was provided in the Authorization header |
| `INVALID_TOKEN` | The provided token is invalid or has expired |

## Validation Rules

The endpoint should perform the following validations:

1. **Token Presence Check**
   - Verify that the Authorization header exists
   - Verify that the token is provided in Bearer format

2. **Token Structure Validation**
   - Verify that the token is a valid JWT format
   - Verify the token signature using the server's JWT secret

3. **Token Claims Validation**
   - Verify that the token hasn't expired (exp claim)
   - Verify that the token was issued at a valid time (iat claim)
   - Verify that the required user claims are present (id, email, role)

4. **Token Status Check**
   - Verify that the token hasn't been revoked or blacklisted
   - Verify that the user account is still active and valid

## Security Considerations

1. **Rate Limiting**
   - Implement rate limiting to prevent brute force attacks
   - Suggested limit: 100 requests per minute per IP

2. **Token Security**
   - Never log or expose the full token in error messages
   - Use secure comparison methods when validating signatures

3. **Error Handling**
   - Return generic error messages to avoid information leakage
   - Log detailed error information server-side for debugging

## Implementation Notes

1. **Performance**
   - Cache user information where appropriate
   - Optimize database queries for token blacklist checks
   - Consider implementing token revocation lists

2. **Monitoring**
   - Log failed verification attempts
   - Track token usage patterns
   - Monitor endpoint performance metrics

## Client Integration

The client should:

1. Call this endpoint when:
   - Restoring authentication state after app launch
   - Validating stored tokens
   - Checking if a token needs refresh

2. Handle responses by:
   - Updating local authentication state
   - Triggering token refresh if needed
   - Redirecting to login on authentication failures

## Example Usage

### cURL Example
```bash
curl -X GET \
  'https://api.example.com/api/auth/verify' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json'
```

### JavaScript Example
```javascript
async function verifyToken(token) {
  const response = await fetch('/api/auth/verify', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

## Related Endpoints

- `/api/auth/login` - User login endpoint
- `/api/auth/token-exchange` - Azure AD token exchange endpoint
- `/api/auth/refresh` - Token refresh endpoint

## Changelog

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2024-03-11 | Initial specification |
