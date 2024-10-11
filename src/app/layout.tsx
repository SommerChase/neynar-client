'use client';

import "./globals.css";
import "@neynar/react/dist/style.css";
import { Header } from "@/components/Header";
import dynamic from 'next/dynamic';
import { Theme } from '@neynar/react';

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
          <Header />
          {children}
        </NeynarContextProvider>
      </body>
    </html>
  );
}
