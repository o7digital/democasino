import "./globals.css";
import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Instrument_Sans } from "next/font/google";

const instrumentSans = Instrument_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Keptos Casino Analytics",
  description: "Dashboard operativo y financiero para casinos Keptos"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={instrumentSans.className}><ClerkProvider>{children}</ClerkProvider></body>
    </html>
  );
}
