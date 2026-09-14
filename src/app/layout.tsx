import type { Metadata } from "next";
import { Be_Vietnam_Pro, MuseoModerno } from "next/font/google";
import "./globals.css";

const museoModerno = MuseoModerno({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  variable: "--font-museo",
});

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-be-vietnam",
});

export const metadata: Metadata = {
  title: "CreateLatam — Educación en IA, diseño de producto y STEM para jóvenes de Latinoamérica",
  description:
    "CreateLatam es una organización sin fines de lucro que acerca inteligencia artificial, diseño de producto y STEM a jóvenes mujeres de toda Latinoamérica.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${museoModerno.variable} ${beVietnamPro.variable}`}>
      <body>{children}</body>
    </html>
  );
}
