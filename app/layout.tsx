import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import 'katex/dist/katex.min.css';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'Maths AI Tutor — Leaving Certificate practice',
    template: '%s · Maths AI Tutor',
  },
  description:
    'Practice Leaving Certificate Maths past-paper questions with a context-aware AI tutor that has the marking scheme and solution steps in front of it.',
  openGraph: {
    title: 'Maths AI Tutor — Leaving Certificate practice',
    description: 'AI-assisted exam preparation grounded in each individual past-paper question.',
    type: 'website',
    locale: 'en_IE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Maths AI Tutor',
    description: 'AI-assisted Leaving Certificate Maths exam preparation.',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
