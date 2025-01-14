import { DocsLayout, type DocsLayoutProps } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/app/layout.config";
/* import "fumadocs-twoslash/twoslash.css"; */
import { source } from "@/app/source";
import DocsNavItem from "@/components/docs/docs-nav-item";
/* import { Trigger } from "@/components/ai/search-ai"; */

const docsOptions: DocsLayoutProps = {
  ...baseOptions,
  tree: source.pageTree,
  disableThemeSwitch: true,
  sidebar: {
    collapsible: false,
    footer: false,
    components: {
      Item: DocsNavItem,
    },
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsLayout {...docsOptions}>{children}</DocsLayout>;
}
