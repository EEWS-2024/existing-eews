import { EEWSProvider } from '@/lib/hooks/eewsCtx';
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" className="bg-indigo-950">
      <Head>
        {/* <meta
          httpEquiv="Content-Security-Policy"
          content="upgrade-insecure-requests"
        /> */}
      </Head>
      <body className="bg-slate-300">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
