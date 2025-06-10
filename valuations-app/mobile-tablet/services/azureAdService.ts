import { MSALInstance, MSALConfiguration, AuthenticationResult } from 'react-native-msal';
import Constants from 'expo-constants';

interface AzureAdConfig {
  clientId: string;
  tenantId: string;
  redirectUri: string;
  apiClientId: string;
}

class AzureAdService {
  private msalInstance: MSALInstance | null = null;
  private config: AzureAdConfig;

  constructor() {
    // Get configuration from environment variables
    this.config = {
      clientId: Constants.expoConfig?.extra?.azureMobileClientId || '',
      tenantId: Constants.expoConfig?.extra?.azureTenantId || '',
      redirectUri: Constants.expoConfig?.extra?.azureRedirectUri || '',
      apiClientId: Constants.expoConfig?.extra?.azureApiClientId || '',
    };

    // Fallback to hardcoded values if expo config is not available
    if (!this.config.clientId) {
      console.warn('Azure AD config not found in expo config, using fallback values');
      this.config = {
        clientId: 'add1ac1d-0559-485d-b590-8d59a2907178',
        tenantId: 'a3509aae-9457-4f3c-aecc-c11dc32c59c7',
        redirectUri: 'msauth://com.qantam.valuations/auth',
        apiClientId: '486ce186-59ce-4305-b2bd-75f94b4bb69b',
      };
    }

    this.initializeMsal();
  }

  private async initializeMsal(): Promise<void> {
    try {
      const msalConfig: MSALConfiguration = {
        auth: {
          clientId: this.config.clientId,
          authority: `https://login.microsoftonline.com/${this.config.tenantId}`,
        },
      };

      this.msalInstance = new MSALInstance(msalConfig);
      console.log('🔐 Azure AD MSAL instance initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize MSAL:', error);
      throw error;
    }
  }

  async signInSilently(): Promise<AuthenticationResult | null> {
    try {
      if (!this.msalInstance) {
        throw new Error('MSAL instance not initialized');
      }

      const result = await this.msalInstance.acquireTokenSilent({
        scopes: [`api://${this.config.apiClientId}/access_as_user`],
      });

      console.log('🔐 Silent sign-in successful');
      return result;
    } catch (error) {
      console.log('ℹ️ Silent sign-in failed, will require interactive login:', error);
      return null;
    }
  }

  async signInInteractive(): Promise<AuthenticationResult> {
    try {
      if (!this.msalInstance) {
        throw new Error('MSAL instance not initialized');
      }

      const result = await this.msalInstance.acquireTokenInteractive({
        scopes: [`api://${this.config.apiClientId}/access_as_user`],
        promptType: 'SELECT_ACCOUNT',
      });

      console.log('🔐 Interactive sign-in successful:', result.account?.username);
      return result;
    } catch (error) {
      console.error('❌ Interactive sign-in failed:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      if (!this.msalInstance) {
        throw new Error('MSAL instance not initialized');
      }

      await this.msalInstance.signOut();
      console.log('🔐 Sign-out successful');
    } catch (error) {
      console.error('❌ Sign-out failed:', error);
      throw error;
    }
  }

  async getAccessToken(): Promise<string | null> {
    try {
      if (!this.msalInstance) {
        throw new Error('MSAL instance not initialized');
      }

      const result = await this.msalInstance.acquireTokenSilent({
        scopes: [`api://${this.config.apiClientId}/access_as_user`],
      });

      return result.accessToken;
    } catch (error) {
      console.error('❌ Failed to get access token:', error);
      return null;
    }
  }

  getConfig(): AzureAdConfig {
    return this.config;
  }
}

// Export a singleton instance
export const azureAdService = new AzureAdService();
export default azureAdService; 