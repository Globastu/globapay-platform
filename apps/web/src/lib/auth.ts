import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import { createGlobapayClient } from '@globapay/sdk';

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      organizationId: string;
      permissions: string[];
      role: string;
    };
    accessToken: string;
    refreshToken: string;
  }

  interface User {
    id: string;
    email: string;
    name: string;
    organizationId: string;
    permissions: string[];
    role: string;
    accessToken: string;
    refreshToken: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    organizationId: string;
    permissions: string[];
    role: string;
    accessToken: string;
    refreshToken: string;
    accessTokenExpires: number;
  }
}

// Utility to determine user role from permissions
function getUserRole(permissions: string[]): string {
  if (permissions.includes('ORGANIZATION_WRITE')) {
    return 'PlatformAdmin';
  }
  if (permissions.includes('USERS_WRITE') && permissions.includes('MERCHANTS_WRITE')) {
    return 'Admin';
  }
  if (permissions.includes('MERCHANTS_WRITE') || permissions.includes('USERS_WRITE')) {
    return 'MerchantAdmin';
  }
  if (permissions.includes('REPORTS_GENERATE') || permissions.includes('AUDIT_LOGS_READ')) {
    return 'Analyst';
  }
  return 'Staff';
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        mfaToken: { label: 'MFA Code (if enabled)', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Use the SDK to authenticate with our API
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
              mfaToken: credentials.mfaToken || undefined,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const data = await response.json();
          const role = getUserRole(data.user.permissions);

          return {
            id: data.user.id,
            email: data.user.email,
            name: data.user.name,
            organizationId: data.user.organizationId,
            permissions: data.user.permissions,
            role,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }): Promise<JWT> {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          userId: user.id,
          organizationId: user.organizationId,
          permissions: user.permissions,
          role: user.role,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires || 0)) {
        return token;
      }

      // Access token has expired, try to refresh it
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          id: token.userId,
          email: token.email as string,
          name: token.name as string,
          organizationId: token.organizationId,
          permissions: token.permissions,
          role: token.role,
        },
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
      };
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  ...(process.env.NEXTAUTH_SECRET && { secret: process.env.NEXTAUTH_SECRET }),
};

/**
 * Takes a token, and returns a new token with updated
 * `accessToken` and `accessTokenExpires`. If an error occurs,
 * returns the old token and an error property
 */
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: token.refreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.accessToken,
      accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15 minutes
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}

// Helper to get authenticated API client
export function getAuthenticatedClient(accessToken: string) {
  return createGlobapayClient({
    baseUrl: process.env.NEXT_PUBLIC_API_URL,
    accessToken,
  });
}