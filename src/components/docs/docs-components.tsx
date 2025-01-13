import { Accordion, Accordions } from "fumadocs-ui/components/accordion";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";
import { TypeTable } from "fumadocs-ui/components/type-table";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { MDXComponents } from "mdx/types";
import { ComponentProps, forwardRef, Fragment } from "react";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { CircleAlert } from "lucide-react";

const Callout = forwardRef<
  HTMLDivElement,
  ComponentProps<(typeof defaultMdxComponents)["Callout"]>
>(({ title, type, icon, children, ...props }, ref) => {
  const variant = type !== "info" ? (type ?? "contrast1") : "contrast1";

  return (
    <Alert ref={ref} {...props} variant={variant}>
      {icon ?? <CircleAlert className="h-4 w-4" />}
      {title && (title as string).length > 0 && (
        <AlertTitle>{title}</AlertTitle>
      )}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
});

Callout.displayName = "Callout";

interface Props {
  slug: string[];
}

const components = ({
  slug,
}: Props): MDXComponents & typeof defaultMdxComponents => {
  return {
    ...defaultMdxComponents,
    Tabs,
    Tab,
    TypeTable,
    Accordion,
    Accordions,
    blockquote: (props) => (
      <Callout {...(props as ComponentProps<typeof Callout>)} />
    ),
    Callout,
    HeadlessOnly: slug[0] === "headless" ? Fragment : () => undefined,
    UIOnly: slug[0] === "ui" ? Fragment : () => undefined,
  };
};

export default components;
