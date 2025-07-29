import axios from 'axios';
import { PublicClientApplication } from '@azure/msal-browser';
import { msalConfig, protectedResources } from '../authConfig';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const msalInstance = new PublicClientApplication(msalConfig);

async function getAccessToken() {
  const accounts = msalInstance.getAllAccounts();
  if (!accounts.length) throw new Error('No user account found');
  const request = {
    account: accounts[0],
    scopes: protectedResources.scopes.read,
  };
  const response = await msalInstance.acquireTokenSilent(request);
  return response.accessToken;
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Optionally: redirect to login or show session expired message
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient; 