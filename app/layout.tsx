import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Minirutina — Tableros personalizados para niños",
  description:
    "Crea tableros de rutinas, planes semanales y tableros de recompensas personalizados para tus hijos. Imprimibles descargables.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={nunito.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
