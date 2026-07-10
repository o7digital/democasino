import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Keptos Casino Analytics",
  description: "Dashboard operativo y financiero para casinos Keptos"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
