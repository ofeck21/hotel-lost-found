import type { Metadata } from "next";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lost & Found - FrontOne & Azana Style Madura",
  description: "Pencatatan barang tamu yang tertinggal di Hotel FrontOne & Azana Style Madura",
  manifest: "/manifest.webmanifest",
  themeColor: "#8a0303",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/icons/icon-192.svg",
  },
  appleWebApp: {
    capable: true,
    title: "Lost & Found - FrontOne & Azana Style Madura",
    statusBarStyle: "default",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
