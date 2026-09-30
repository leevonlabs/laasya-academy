import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Laasya Cultural Academy | Owner Management Portal',
  description: 'Official management system for Laasya Cultural Academy. Unlock Your Talent.',
  icons: {
    icon: '/crest_logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FFF9FB] text-[#220314] antialiased">
        {children}
      </body>
    </html>
  );
}
