import { DocsLayout, type DocsLayoutProps } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { baseOptions } from "@/app/layout.config";
/* import "fumadocs-twoslash/twoslash.css"; */
import { source } from "@/app/source";
import { RootToggle } from "fumadocs-ui/components/layout/root-toggle";
/* import { Trigger } from "@/components/ai/search-ai"; */

const docsOptions: DocsLayoutProps = {
  ...baseOptions,
  tree: source.pageTree,
  disableThemeSwitch: true,
  sidebar: {
    className: "!border-r-0",
    collapsible: false,
    footer: false,
    banner: <RootToggle options={[{ title: "test", url: "/" }]} />,
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsLayout {...docsOptions}>{children}</DocsLayout>;
}
