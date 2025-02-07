import { Accordion, Accordions } from 'fumadocs-ui/components/accordion'
import { Tab, Tabs as FumaTabs, TabsProps } from 'fumadocs-ui/components/tabs'
import { TypeTable } from 'fumadocs-ui/components/type-table'
import defaultMdxComponents from 'fumadocs-ui/mdx'
import { MDXComponents } from 'mdx/types'
import { ComponentProps, forwardRef, Fragment } from 'react'
import { AlertCircle } from 'lucide-react'
import {
  Pre,
  CodeBlock as FumaCodeBlock,
  CodeBlockProps,
} from 'fumadocs-ui/components/codeblock'
import { Alert, AlertDescription, AlertTitle } from '@/ui/primitives/alert'

const Callout = forwardRef<
  HTMLDivElement,
  ComponentProps<(typeof defaultMdxComponents)['Callout']>
>(({ title, type, icon, children, ...props }, ref) => {
  const variant = type !== 'info' ? (type ?? 'contrast1') : 'contrast1'

  return (
    <Alert ref={ref} variant={variant} className="ml-4 p-4">
      {icon ?? <AlertCircle className="h-4 w-4" />}
      {title && (title as string).length > 0 && (
        <AlertTitle>{title}</AlertTitle>
      )}
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
})

Callout.displayName = 'Callout'

const Blockquote = forwardRef<HTMLQuoteElement, ComponentProps<'blockquote'>>(
  ({ children, ...props }, ref) => {
    return (
      <blockquote
        ref={ref}
        className="ml-4 border-l-[3px] border-contrast-2"
        {...props}
      >
        {children}
      </blockquote>
    )
  }
)

Blockquote.displayName = 'Blockquote'

const CodeBlock = forwardRef<HTMLPreElement, CodeBlockProps>(
  ({ children, ...props }, ref) => {
    return (
      <FumaCodeBlock ref={ref} {...props}>
        <Pre>{children}</Pre>
      </FumaCodeBlock>
    )
  }
)

CodeBlock.displayName = 'CodeBlock'

const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  ({ children, ...props }, ref) => {
    return <FumaTabs {...props}>{children}</FumaTabs>
  }
)

Tabs.displayName = 'Tabs'

interface Props {
  slug: string[]
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
    Callout,
    blockquote: Blockquote,
    pre: CodeBlock,
    HeadlessOnly: slug[0] === 'headless' ? Fragment : () => undefined,
    UIOnly: slug[0] === 'ui' ? Fragment : () => undefined,
  }
}

export default components
