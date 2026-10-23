import type { Metadata } from 'next';
import { Playfair_Display, Poppins } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['600', '700', '800'],
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Laasya Cultural Academy | Unleash Your Talent — Bangalore',
  description:
    'Premium training in Bharatanatyam, Carnatic music, instruments, visual arts, yoga, and martial arts at Kannamangala, Bangalore. 18 art forms, expert gurus, certified courses.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/laasya_logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/images/laasya_logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="min-h-screen text-[#220314] antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
