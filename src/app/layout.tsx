import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { APP_CONFIG } from "@/lib/constants";
import { SessionErrorProvider } from "@/components/providers/session-error-boundary";
import { SessionValidator } from "@/components/session-validator";
import { ToastProvider } from "@/components/providers/toast-provider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.NAME,
    template: `%s | ${APP_CONFIG.NAME}`,
  },
  description: APP_CONFIG.DESCRIPTION,
  keywords: [
    "ANTAM",
    "Sistem Informasi",
    "Operasional",
    "Pertambangan",
    "Maintenance",
    "Equipment",
  ],
  authors: [
    {
      name: "PONGKOR ENGINEERING",
    },
  ],
  creator: "PONGKOR ENGINEERING",
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: process.env.NEXTAUTH_URL,
    title: APP_CONFIG.NAME,
    description: APP_CONFIG.DESCRIPTION,
    siteName: APP_CONFIG.NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: APP_CONFIG.NAME,
    description: APP_CONFIG.DESCRIPTION,
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="id" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ToastProvider>
          <SessionErrorProvider>
            <SessionProvider
              session={session}
              refetchInterval={0} // Disable auto-refresh to prevent excessive polling
              refetchOnWindowFocus={false}
              refetchWhenOffline={false}
            >
              <SessionValidator>
                {children}
              </SessionValidator>
            </SessionProvider>
          </SessionErrorProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
