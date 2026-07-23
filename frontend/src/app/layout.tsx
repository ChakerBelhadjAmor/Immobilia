import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { ToastProvider } from "@/components/ui/toast";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Immobil'IA — L'immobilier augmenté par l'intelligence",
    template: "%s · Immobil'IA",
  },
  description:
    "Plateforme immobilière augmentée par l'IA : vendez au juste prix, trouvez le bien qui vous ressemble, investissez avec des données fiables.",
  icons: { icon: "/brand/logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
