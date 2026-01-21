import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "DS Dashboard - Data Science Competition Platform",
  description: "Kaggle-style data science competition platform. Challenge yourself, submit predictions, and track your progress on the leaderboard.",
  keywords: ["data science", "machine learning", "competition", "leaderboard", "kaggle"],
  authors: [{ name: "DS Dashboard Team" }],
  openGraph: {
    title: "DS Dashboard - Data Science Competition Platform",
    description: "Challenge yourself with data science competitions and track your progress.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        style={{
          background: "var(--background)",
          color: "var(--text-primary)",
        }}
      >
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
