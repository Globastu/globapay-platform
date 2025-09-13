'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@globapay/ui';

export default function SignInPage(): JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaToken, setMfaToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMfa, setShowMfa] = useState(false);

  const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        mfaToken: mfaToken || undefined,
        redirect: false,
      });

      if (result?.error) {
        if (result.error.includes('MFA token required')) {
          setShowMfa(true);
          setError('Please enter your MFA code');
        } else {
          setError('Invalid credentials. Please try again.');
        }
      } else if (result?.ok) {
        // Refresh the session to get the latest data
        await getSession();
        router.push(callbackUrl);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Globapay Platform
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Email address"
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Password"
            />
          </div>
          {showMfa && (
            <div>
              <label htmlFor="mfaToken" className="sr-only">
                MFA Code
              </label>
              <input
                id="mfaToken"
                name="mfaToken"
                type="text"
                maxLength={6}
                pattern="\d{6}"
                value={mfaToken}
                onChange={(e) => setMfaToken(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="6-digit MFA code"
              />
            </div>
          )}
          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}
          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>
        <div className="text-sm text-center text-gray-600">
          <p>Test users:</p>
          <p>admin@globapay.com / admin123</p>
          <p>user@acmehealthcare.com / user123</p>
          <p>owner@techflow.com / owner123</p>
        </div>
      </div>
    </div>
  );
}