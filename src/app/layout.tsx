import "@/app/_fonts/fonts";
import "@/styles/globals.css";

import { RootProvider } from "fumadocs-ui/provider";
import { Body } from "./layout.client";
import { ToastProvider } from "@/ui/primitives/toast";
import { Toaster } from "@/ui/primitives/toaster";
import { TooltipProvider } from "@/ui/primitives/tooltip";
import { BASE_URL } from "@/configs/urls";
import { Metadata } from "next/types";
import { METADATA } from "@/configs/metadata";
import ClientProviders from "@/features/client-providers";
import { DrawerCSSProvider } from "@/ui/drawer-css-provider";

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
      {/*       <Script src="https://unpkg.com/react-scan/dist/auto.global.js" async /> */}
      <Body>
        <RootProvider
          theme={{
            attribute: "class",
            defaultTheme: "system",
            enableSystem: true,
            disableTransitionOnChange: true,
          }}
        >
          <TooltipProvider>
            <ToastProvider>
              <ClientProviders>{children}</ClientProviders>
              <Toaster />
            </ToastProvider>
          </TooltipProvider>
        </RootProvider>
      </Body>
    </html>
  );
}
