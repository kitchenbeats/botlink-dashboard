import { RootProvider } from "fumadocs-ui/provider";
import { Body } from "./layout.client";
import { ToastProvider } from "@/ui/primitives/toast";
import { Toaster } from "@/ui/primitives/toaster";
import { TooltipProvider } from "@/ui/primitives/tooltip";
import { BASE_URL } from "@/configs/urls";
import { Metadata } from "next/types";
import { METADATA } from "@/configs/metadata";

import "@/app/_fonts/fonts";
import "@/styles/globals.css";
import { ThemeProvider } from "next-themes";
import ClientProviders from "@/features/client-providers";

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
      <body className="relative flex min-h-screen flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider>
            <ToastProvider>
              <ClientProviders>{children}</ClientProviders>
              <Toaster />
            </ToastProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
