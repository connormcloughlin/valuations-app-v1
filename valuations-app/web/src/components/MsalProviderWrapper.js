import React from 'react';
import { MsalProvider } from '@azure/msal-react';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig } from '../authConfig';

// Initialize MSAL outside of the component
const msalInstance = new PublicClientApplication(msalConfig);

// Handle the response from auth redirects/popups
msalInstance.handleRedirectPromise().catch(error => {
    console.error('Error handling redirect:', error);
});

const MsalProviderWrapper = ({ children }) => {
    return (
        <MsalProvider instance={msalInstance}>
            {children}
        </MsalProvider>
    );
};

export default MsalProviderWrapper; 