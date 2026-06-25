import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aura | Gallery-Grade Art Auctions",
  description: "Elite digital venue for decentralized premium contemporary art collections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="en" 
      className={`${inter.variable} ${cormorant.variable} ${jetbrains.variable}`}
    >
      <body className="antialiased selection:bg-gold-accent/30 selection:text-text-primary">
        {/* Global Navigation Wrapper can go here later */}
        <main className="relative min-height-screen">
          {children}
        </main>
      </body>
    </html>
  );
}