import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AnimatedBackground } from '@/components/luxury/animated-background';
import { Toaster } from 'react-hot-toast';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'AdwaFlix – Premium Streaming Platform',
  description:
    'Experience cinema in 4K HDR with zero buffering. The god‑tier streaming experience.',
  keywords: [
    'movies',
    'tv shows',
    'streaming',
    'premium',
    '4K',
    'AdwaFlix',
  ],
  openGraph: {
    title: 'AdwaFlix – Premium Streaming',
    description: 'Luxury cinema, zero compromise.',
    type: 'website',
    siteName: 'AdwaFlix',
  },
  other: {
    'theme-color': '#0a0a0a',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className="bg-black text-white overflow-x-hidden antialiased selection:bg-amber-500/30 selection:text-white">
        <AnimatedBackground />
        <Toaster
          position="top-center"
          reverseOrder={false}
          toastOptions={{
            style: {
              background: 'rgba(20,20,20,0.95)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              borderRadius: '1rem',
              boxShadow: '0 0 30px rgba(251,146,60,0.1)',
            },
          }}
        />
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}