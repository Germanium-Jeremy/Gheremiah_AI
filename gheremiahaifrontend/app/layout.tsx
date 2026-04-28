import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gheremiah AI",
  description: "Gemini AI-powered assistant by Jeremie",
  keywords: "AI, assistant, Gemini, Gheremiah, Jeremie, technology, chatbot",
  authors: {
    "name": "Jeremie NKUNDABAGENZI",
    "url": "https://github.com/jeremi-ai",
  },
  creator: "Jeremie NKUNDABAGENZI",
  publisher: "Jeremie NKUNDABAGENZI",
  robots: "index, follow", // Indicate to search engines to index and follow links
  openGraph: {
    title: "Gheremiah AI",
    description: "Gemini AI-powered assistant by Jeremie",
    type: "website",
    url: "https://gheremiahai.vercel.app",
    images: [
      {
        url: "https://gheremiahai.vercel.app/favicon.ico",
        width: 1200,
        height: 630,
        alt: "Gheremiah AI",
      },
    ],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
