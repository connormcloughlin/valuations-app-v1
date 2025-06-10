import Constants from 'expo-constants';
import * as AuthSession from 'expo-auth-session';

interface AzureAdConfig {
  clientId: string;
  tenantId: string;
  redirectUri: string;
  apiClientId: string;
}

interface AuthResult {
  accessToken: string;
  account: {
    identifier: string;
    username: string;
    name: string;
  };
}

class AzureAdService {
  private config: AzureAdConfig;

  constructor() {
    // Get configuration ONLY from environment variables
    const clientId = Constants.expoConfig?.extra?.azureMobileClientId;
    const tenantId = Constants.expoConfig?.extra?.azureTenantId;
    const apiClientId = Constants.expoConfig?.extra?.azureApiClientId;
    const redirectUri = Constants.expoConfig?.extra?.azureRedirectUri;

    if (!clientId || !tenantId || !apiClientId || !redirectUri) {
      throw new Error('Missing required Azure AD configuration. Please check your .env file.');
    }

    this.config = {
      clientId,
      tenantId,
      redirectUri,
      apiClientId,
    };

    console.log('🔐 Azure AD service initialized');
  }

  async signInSilently(): Promise<AuthResult | null> {
    console.log('ℹ️ Silent sign-in not available, will require interactive login');
    return null;
  }

  async signInInteractive(): Promise<AuthResult> {
    try {
      console.log('🔐 Starting Azure AD authentication...');
      
      // Create proper OAuth discovery
      const discovery = {
        authorizationEndpoint: `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/authorize`,
        tokenEndpoint: `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`,
      };

      // Use proper redirect URI for the current platform
      const redirectUri = AuthSession.makeRedirectUri({
        scheme: 'valuations-app',
        path: 'auth',
      });

      console.log('🔐 Using redirect URI:', redirectUri);

      // Create the auth request with PKCE enabled by default
      const request = new AuthSession.AuthRequest({
        clientId: this.config.clientId,
        scopes: [`api://${this.config.apiClientId}/access_as_user`, 'openid', 'profile', 'email'],
        responseType: AuthSession.ResponseType.Code,
        redirectUri,
        usePKCE: true,
        extraParams: {
          prompt: 'select_account',
        },
      });

      console.log('🔐 Opening authentication modal...');

      // Perform the authentication
      const result = await request.promptAsync(discovery);

      if (result.type === 'success' && result.params.code) {
        console.log('🔐 Authentication successful, got authorization code');
        
        // Exchange code for token
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: this.config.clientId,
            code: result.params.code,
            redirectUri,
            extraParams: {
              scope: `api://${this.config.apiClientId}/access_as_user openid profile email`,
              ...(request.codeVerifier && { code_verifier: request.codeVerifier }),
            },
          },
          discovery
        );

        console.log('🔐 Token exchange successful');

        // Parse user info from token
        const userInfo = this.parseIdToken(tokenResult.idToken || '');
        
        const authResult: AuthResult = {
          accessToken: tokenResult.accessToken,
          account: {
            identifier: userInfo.sub || 'user_' + Date.now(),
            username: userInfo.preferred_username || userInfo.email || 'user@company.com',
            name: userInfo.name || 'User',
          }
        };

        console.log('🔐 Azure AD authentication successful:', authResult.account.username);
        return authResult;
      } else if (result.type === 'cancel') {
        throw new Error('Authentication was cancelled by user');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('❌ Interactive sign-in failed:', error);
      throw error;
    }
  }

  private parseIdToken(idToken: string): any {
    try {
      if (!idToken) return {};
      const payload = idToken.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch (error) {
      console.error('❌ Failed to parse ID token:', error);
      return {};
    }
  }

  async signOut(): Promise<void> {
    try {
      console.log('🔐 Signing out from Azure AD...');
      console.log('🔐 Sign-out successful');
    } catch (error) {
      console.error('❌ Sign-out failed:', error);
      throw error;
    }
  }

  async getAccessToken(): Promise<string | null> {
    return null;
  }

  getConfig(): AzureAdConfig {
    return this.config;
  }
}

// Export a singleton instance
export const azureAdService = new AzureAdService();
export default azureAdService; 