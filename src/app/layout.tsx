import { RootProvider } from "fumadocs-ui/provider";
import { Body } from "./layout.client";

import "@/app/_fonts/fonts";

import "@/styles/globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import { BASE_URL } from "@/configs/urls";
import { Metadata } from "next/types";
import { METADATA } from "@/configs/metadata";
import Head from "next/head";

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
      <Head>
        <script src="https://unpkg.com/react-scan/dist/auto.global.js" async />
      </Head>
      <Body>
        <RootProvider
          theme={{
            attribute: "class",
            defaultTheme: "system",
            enableSystem: true,
            disableTransitionOnChange: true,
          }}
        >
          <ToastProvider>
            {children}
            <Toaster />
          </ToastProvider>
        </RootProvider>
      </Body>
    </html>
  );
}
