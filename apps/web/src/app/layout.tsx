import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth/next';
import { Providers } from '../components/providers';
import { DashboardShell } from '../components/layouts/dashboard-shell';
import { ThemeScript } from '../components/theme-script';
import { authOptions } from '../lib/auth';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Globapay Platform',
  description: 'Multi-tenant payments orchestration platform',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<JSX.Element> {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className={inter.className}>
        <Providers session={session}>
          <DashboardShell>
            {children}
          </DashboardShell>
        </Providers>
      </body>
    </html>
  );
}