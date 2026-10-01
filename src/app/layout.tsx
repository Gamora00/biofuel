import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BioLoop Monitoring | SmartBin UCO Collection & Biofuel Feedstock",
  description: "Real-time IoT monitoring and feedstock quality assessment for Used Cooking Oil (UCO) SmartBins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased min-h-screen bg-[#f4f6f5]`}>
        {children}
      </body>
    </html>
  );
}
