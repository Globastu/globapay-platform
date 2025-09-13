import createClient, { type ClientOptions } from 'openapi-fetch';
import type { paths } from './generated/types';

export interface GlobapayClientConfig {
  baseUrl?: string;
  apiKey?: string;
  accessToken?: string;
  headers?: Record<string, string>;
}

export type GlobapayClient = ReturnType<typeof createGlobapayClient>;

export function createGlobapayClient(config: GlobapayClientConfig = {}) {
  const {
    baseUrl = 'http://localhost:3001',
    apiKey,
    accessToken,
    headers = {},
  } = config;

  const authHeaders: Record<string, string> = {};
  
  if (accessToken) {
    authHeaders.Authorization = `Bearer ${accessToken}`;
  } else if (apiKey) {
    authHeaders['X-API-Key'] = apiKey;
  }

  const clientOptions: ClientOptions = {
    baseUrl,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...headers,
    },
  };

  return createClient<paths>(clientOptions);
}