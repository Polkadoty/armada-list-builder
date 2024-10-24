import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from "@/components/ui/tooltip";
import { UniqueClassProvider } from '../contexts/UniqueClassContext'; // Import the provider
import { Analytics } from "@vercel/analytics/react";
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <ThemeProvider attribute="class">
        <TooltipProvider>
          <UniqueClassProvider>
            <Component {...pageProps} />
            <Analytics />
          </UniqueClassProvider>
        </TooltipProvider>
      </ThemeProvider>
    </>
  );
}

export default MyApp;
