import "@/app/_fonts/fonts";
import "@/styles/globals.css";

import { RootProvider } from "fumadocs-ui/provider";
import { Body } from "./layout.client";
import { BASE_URL } from "@/configs/urls";
import { Metadata } from "next/types";
import { METADATA } from "@/configs/metadata";
import ClientProviders from "@/features/client-providers";
import Script from "next/script";
import { Suspense } from "react";
import { GeneralAnalyticsCollector } from "@/features/general-analytics-collector";
import { Toaster } from "@/ui/primitives/toaster";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: "%s - E2B",
    default: METADATA.title,
  },
  description: "Open-source secure sandboxes for AI code execution",
  twitter: {
    title: METADATA.title,
    description: METADATA.description,
  },
  openGraph: {
    title: METADATA.title,
    description: METADATA.description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {process.env.NEXT_PUBLIC_SCAN && process.env.NEXT_PUBLIC_SCAN === "1" && (
        <Script src="https://unpkg.com/react-scan/dist/auto.global.js" async />
      )}
      <Body>
        <ClientProviders>
          {children}
          <Suspense>
            <GeneralAnalyticsCollector />
            <Toaster />
          </Suspense>
        </ClientProviders>
      </Body>
    </html>
  );
}
