import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { getServerSession } from 'next-auth/next';
import { Providers } from '../components/providers';
import { DashboardShell } from '../components/layout/dashboard-shell';
import { authOptions } from '../lib/auth';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

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
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <Providers session={session}>
          <DashboardShell>
            {children}
          </DashboardShell>
        </Providers>
      </body>
    </html>
  );
}