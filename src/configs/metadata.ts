import type { Metadata } from "next/types";
import { createMetadataImage } from "fumadocs-core/server";
import { source } from "@/app/source";

export const METADATA = {
  title: "E2B - Code Interpreting for AI apps",
  description: "Open-source secure sandboxes for AI code execution",
};

export const metadataImage = createMetadataImage({
  source,
  imageRoute: "og",
});

export function createMetadata(override: Metadata): Metadata {
  return {
    ...override,
    openGraph: {
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      url: "https://fumadocs.vercel.app",
      images: "/banner.png",
      siteName: "Fumadocs",
      ...override.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      creator: "@money_is_shark",
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      images: "/banner.png",
      ...override.twitter,
    },
  };
}

export const baseUrl =
  process.env.NODE_ENV === "development" || !process.env.VERCEL_URL
    ? new URL("http://localhost:3000")
    : new URL(`https://${process.env.VERCEL_URL}`);
