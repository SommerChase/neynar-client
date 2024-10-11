'use client';

import "./globals.css";
import "@neynar/react/dist/style.css";
import { Header } from "@/components/Header";
import dynamic from 'next/dynamic';
import { Theme } from '@neynar/react';
import { ThemeProvider } from '@/context/ThemeContext';
import { PrivyProvider } from '@privy-io/react-auth';

const NeynarContextProvider = dynamic(
  () => import('@neynar/react').then((mod) => mod.NeynarContextProvider),
  { ssr: false }
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PrivyProvider
          appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''}
          config={{
            loginMethods: ['farcaster'],
            appearance: {
              theme: 'dark',
              accentColor: '#e94560',
            },
          }}
        >
          <NeynarContextProvider
            settings={{
              clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || "",
              defaultTheme: Theme.Dark,
              eventsCallbacks: {
                onAuthSuccess: () => {},
                onSignout() {},
              },
            }}
          >
            <ThemeProvider>
              <Header />
              {children}
            </ThemeProvider>
          </NeynarContextProvider>
        </PrivyProvider>
      </body>
    </html>
  );
}
