import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from "@/components/ui/tooltip";
import { UniqueClassProvider } from '../contexts/UniqueClassContext';
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { UserProvider } from '@auth0/nextjs-auth0/client';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <ThemeProvider attribute="class">
        <TooltipProvider>
          <UniqueClassProvider>
            <UserProvider>
              <Component {...pageProps} />
            </UserProvider>
            <Analytics />
            <SpeedInsights />
          </UniqueClassProvider>
        </TooltipProvider>
      </ThemeProvider>
    </>
  );
}

export default MyApp;
