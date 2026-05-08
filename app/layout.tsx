import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Éduc'Harmonia — École en ligne GS au CM2",
    template: "%s | Éduc'Harmonia",
  },
  description: "Éduc'Harmonia, école 100% en ligne de la Grande Section au CM2. L'épanouissement de l'élève grâce à une instruction sur des bases solides.",
  keywords: ["école en ligne", "primaire", "GS", "CP", "CE1", "CE2", "CM1", "CM2", "cours en ligne", "devoirs", "Éduc'Harmonia"],
  authors: [{ name: "Éduc'Harmonia" }],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Éduc'Harmonia",
    title: "Éduc'Harmonia — École en ligne GS au CM2",
    description: "École 100% en ligne de la Grande Section au CM2. Cours, devoirs et sessions Zoom avec vos enseignants.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Éduc'Harmonia — École en ligne GS au CM2",
    description: "École 100% en ligne de la Grande Section au CM2.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          <Providers>{children}</Providers>
        </body>
    </html>
  );
}
