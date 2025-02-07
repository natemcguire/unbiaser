import './globals.css';
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

export const metadata: Metadata = {
  title: 'Unbiaser - Political Bias Analysis',
  description: 'Analyze political bias in news articles and get balanced perspectives',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={GeistSans.className}>
      <body>
        {children}
      </body>
    </html>
  );
}
