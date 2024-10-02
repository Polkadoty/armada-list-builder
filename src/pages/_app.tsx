import type { AppProps } from 'next/app';
import { ThemeProvider } from 'next-themes';
import { TooltipProvider } from "@/components/ui/tooltip"
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class">
      <TooltipProvider>
        <Component {...pageProps} />
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default MyApp;