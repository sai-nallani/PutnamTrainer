import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./putnam.css";
import ClientNav from "./ClientNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Putnam Trainer",
  description: "Putnam Problems Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
  <html lang="en" data-theme="dark" data-font="serif" data-bold="false">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
    <ClientNav />
        {children}
      </body>
    </html>
  );
}
