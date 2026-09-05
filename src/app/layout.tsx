import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { siteConfig } from "@/config/site";

const siteUrl = new URL(siteConfig.url);

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "ACRUX ROBOCEP | Equipe de Robótica",
    template: "%s | ACRUX ROBOCEP",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: ["ACRUX", "ROBOCEP", "robótica", "tecnologia", "engenharia"],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    title: "ACRUX ROBOCEP | Equipe de Robótica",
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary",
    title: "ACRUX ROBOCEP | Equipe de Robótica",
    description: siteConfig.description,
  },
  icons: {
    icon: "/brand/acrux-logo.jpg",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#020817",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#main-content">
          Pular para o conteúdo
        </a>
        <div className="site-shell">
          <Header />
          <div id="main-content">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}

