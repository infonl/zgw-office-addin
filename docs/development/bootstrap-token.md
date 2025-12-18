# Bootstrap Token

This document describes the Bootstrap Token that is retrieved for the usage of Graph API in the add-in and user details. It also describes how to handle the errors that can be thrown when requesting this token

## What is a Bootstrap Token?

A bootstrap token is the initial access token provided by Office to authenticate the user. This token is used to access Microsoft Graph API and other resources. The add-in automatically retrieves a bootstrap token when it is loaded.

## Error 13006 - Token Expired During Authentication

**Error code:** `13006`

**When does this error occur:**
- When obtaining a bootstrap token in an online Office environment (Office Online/Office 365)
- During the first authentication attempt after loading the add-in
- When an existing token has expired during an authentication flow

**Description:**
This error occurs when Office attempts to retrieve a bootstrap token, but the token has expired before the authentication flow is completed. This is a known issue in Office Online environments.

**Possible causes:**
- Time synchronization issues between client and server
- Token lifetime is too short for the authentication flow
- Network latency during authentication
- Office Online specific timing issues

**Automatic handling:**
The add-in has implemented an automatic retry mechanism for this error:

```typescript
// In getAccessToken.ts
if (errorWithCode.code === 13006) {
  // Wait 500ms
  await new Promise((resolve) => setTimeout(resolve, 500));
  // Retry
  return Office.auth.getAccessToken({
    allowSignInPrompt: true,
    allowConsentPrompt: true,
    forceAddAccount: false,
  });
}
```

**Fallback mechanism:**
If the standard authentication method fails, the add-in automatically attempts an alternative method via `Office.context.auth.getAccessTokenAsync`.

**When the automatic retry doesn't work:**
1. Refresh the page/restart Outlook
2. Sign out and sign in again to Office 365
3. Clear browser cache (for Office Online)
4. Check if the system clock is set correctly

## Error 13001 - User Not Logged In

**Error code:** `13001`

**When does this error occur:**
- User is not logged in to Office/Microsoft 365
- Session has expired

**Solution:**
- User will be automatically prompted to sign in (`allowSignInPrompt: true`)
- Manually sign in to Office 365

## Error 13002 - User Cancelled Authentication

**Error code:** `13002`

**When does this error occur:**
- User clicks "Cancel" in the authentication dialog
- User closes the sign-in window

**Solution:**
- Try the action again
- User must complete the authentication

## Error 13003 - Add-in Type Not Supported

**Error code:** `13003`

**When does this error occur:**
- The add-in type (manifest configuration) does not support SSO authentication

**Solution:**
- Check the manifest configuration
- Ensure `<WebApplicationInfo>` is correctly configured in manifest.xml

## Error 13004 - Invalid Resource/Audience

**Error code:** `13004`

**When does this error occur:**
- The requested resource (Microsoft Graph, etc.) is not correctly configured
- Audience claim does not match

**Important:** Ensure your code formatter is configured correctly. New lines or line breaks in your manifest can invalidate certain links or values. For example:

❌ **Invalid (line break added by formatter):**
```xml
<Resource>
  api://localhost:3000/696724da-f71f-40c4-9dce-53ab2bc8e0cb
</Resource>
```

✅ **Valid (single line):**
```xml
<Resource>api://localhost:3000/696724da-f71f-40c4-9dce-53ab2bc8e0cb</Resource>
```
This will result in a 13004 error when requesting the bootstrap token.

**Solution:**
- Check the Azure AD app registration
- Verify the `<Resource>` configuration in manifest.xml
- Check the API permissions in Azure AD

## Error 13005 - Invalid Grant/Consent Missing

**Error code:** `13005`

**When does this error occur:**
- User or admin has not granted consent for the requested permissions
- App registration in Azure AD is not correct

**Solution:**
- Admin must grant consent in Azure AD portal
- User will be prompted to grant consent (`allowConsentPrompt: true`)
- Check the API permissions in the Azure AD app registration

## Error 13007 - Network Error

**Error code:** `13007`

**When does this error occur:**
- No internet connection
- Firewall blocks authentication endpoints
- Proxy issues

**Solution:**
- Check internet connection
- Check firewall/proxy settings
- Ensure `login.microsoftonline.com` is reachable

## Error 13008 - Internal Error

**Error code:** `13008`

**When does this error occur:**
- Internal Office error
- Azure AD service issues

**Solution:**
- Try again after a few minutes
- Check [Microsoft 365 Service Health](https://status.office.com/)
- Restart Office application

## Bootstrap Token Cache and Fallback Mechanism

The add-in implements an intelligent token caching and fallback mechanism:

### Token Caching
- Bootstrap tokens are cached to prevent unnecessary authentication requests
- Cached tokens are automatically refreshed 60 seconds before expiration
- Cache is cleared on authentication errors

### Fallback Strategy

1. **Primary method:** `Office.auth.getAccessToken()`
   - First attempts to retrieve bootstrap token via the standard Office.auth API
   - Contains retry logic for error 13006

2. **Fallback method:** `Office.context.auth.getAccessTokenAsync()`
   - If primary method fails, attempts the context-based API
   - Only available in certain Office environments

3. **Second fallback:** `Office.auth.getAccessToken()` without context
   - If context.auth is not available, falls back to standard method

### Code Example

```typescript
// Primary method with retry for 13006
tokenPromise = getTokenThroughAuthModule()
  .catch(async (error) => {
    // Try context-based auth as fallback
    const officeContext = Office.context as ExtendedOfficeContext;
    if (officeContext?.auth?.getAccessTokenAsync) {
      return getTokenThroughContext();
    }
    throw error;
  })
```

## Debugging

### Console logging
The add-in logs debug information to the browser console (development mode only):

```
[DEBUG] [getAccessToken] Using cached token
[DEBUG] [getAccessToken] Auth module failed, trying context-based auth
[DEBUG] [getAccessToken] Using office context auth
```

### Bootstrap Token Inspection
Bootstrap tokens are JWT tokens that can be inspected on [jwt.io](https://jwt.io) to:
- Check expiration time
- Verify claims
- Validate audience

## References

- [Office SSO Error codes](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/troubleshoot-sso-in-office-add-ins)
- [Azure AD error codes](https://learn.microsoft.com/en-us/azure/active-directory/develop/reference-aadsts-error-codes)
- [Enable SSO in Office Add-ins](https://learn.microsoft.com/en-us/office/dev/add-ins/develop/sso-in-office-add-ins)
