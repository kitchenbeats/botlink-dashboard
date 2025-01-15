import type { Metadata } from "next";
import {
  DocsPage,
  DocsBody,
  DocsTitle,
  DocsDescription,
  DocsCategory,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import { type ReactElement } from "react";
/* import { Popup, PopupContent, PopupTrigger } from "fumadocs-twoslash/ui"; */
/* import * as Preview from "@/components/preview"; */
import { source } from "@/app/source";
import { createMetadata, metadataImage } from "@/lib/metadata";
import { METADATA } from "@/configs/metadata";
import components from "@/components/docs/docs-components";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* function PreviewRenderer({ preview }: { preview: string }): ReactNode {
  if (preview && preview in Preview) {
    const Comp = Preview[preview as keyof typeof Preview];
    return <Comp />;
  }

  return null;
} */

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<ReactElement> {
  const params = await props.params;

  const page = source.getPage(params.slug);

  if (!page) notFound();

  const path = `src/content/docs/${page.file.path}`;
  const preview = page.data.preview;
  const { body: Mdx, toc, lastModified } = await page.data.load();

  return (
    <DocsPage
      toc={toc}
      lastUpdate={lastModified}
      full={page.data.full}
      tableOfContent={{
        style: "clerk",
        single: false,
      }}
      editOnGithub={{
        repo: "dashboard",
        owner: "e2b-dev",
        sha: "main",
        path,
        className: cn(
          buttonVariants({ variant: "outline" }),
          "rounded-none text-xs",
        ),
      }}
      article={{
        className: "max-sm:pb-16 mt-2 xl:pt-10",
      }}
    >
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        {/*         {preview ? <PreviewRenderer preview={preview} /> : null} */}
        <Mdx components={components({ slug: params.slug || [] })} />
        {page.data.index ? <DocsCategory page={page} from={source} /> : null}
      </DocsBody>
    </DocsPage>
  );
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);

  if (!page) notFound();

  const description = page.data.description ?? METADATA.description;

  return createMetadata(
    metadataImage.withImage(page.slugs, {
      title: page.data.title,
      description,
      openGraph: {
        url: `/docs/${page.slugs.join("/")}`,
      },
    }),
  );
}

export function generateStaticParams(): { slug: string[] }[] {
  return source.generateParams();
}
