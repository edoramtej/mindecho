import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MindEcho — Exprésate libremente",
  description: "Registra tu bienestar emocional de forma anónima y ayuda a entender la salud mental de tu comunidad.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es" className={inter.variable}>
        <body className="min-h-screen bg-[#0A0A1A] text-slate-200 antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
