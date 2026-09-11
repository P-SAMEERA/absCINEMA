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
  title: "absCinema — Stories Deserve A Screen",
  description: "A screenplay goes in. A cinematic web experience comes out. Interactive cinema mode with dynamic soundscapes, letterbox aesthetics, and procedural atmosphere.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#07080a] text-cinema-100 min-h-screen selection:bg-cinema-gold selection:text-black`}
      >
        {children}
      </body>
    </html>
  );
}
