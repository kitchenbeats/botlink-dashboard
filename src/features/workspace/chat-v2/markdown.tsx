'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { cn } from '@/lib/utils'

interface MarkdownProps {
  content: string
  className?: string
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn('prose prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-2xl font-bold text-gray-100 mt-6 mb-4">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-xl font-semibold text-gray-100 mt-5 mb-3">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-lg font-semibold text-gray-200 mt-4 mb-2">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-base font-semibold text-gray-200 mt-3 mb-2">{children}</h4>
        ),

        // Paragraphs
        p: ({ children }) => (
          <p className="text-[15px] leading-relaxed text-gray-100 mb-4 last:mb-0">{children}</p>
        ),

        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-inside space-y-1 mb-4 text-gray-100">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside space-y-1 mb-4 text-gray-100">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-[15px] leading-relaxed text-gray-100 ml-2">{children}</li>
        ),

        // Code blocks
        code: ({ className, children, ...props }) => {
          const inline = !className

          if (inline) {
            return (
              <code
                className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-blue-300 font-mono text-[13px]"
                {...props}
              >
                {children}
              </code>
            )
          }

          return (
            <code
              className={cn(
                'block bg-black/40 border border-white/10 rounded-lg p-4 overflow-x-auto font-mono text-[13px] leading-relaxed',
                className
              )}
              {...props}
            >
              {children}
            </code>
          )
        },

        pre: ({ children }) => (
          <pre className="mb-4 overflow-hidden rounded-lg bg-black/40 border border-white/10">
            {children}
          </pre>
        ),

        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-500/50 pl-4 py-2 mb-4 bg-blue-500/5 rounded-r">
            {children}
          </blockquote>
        ),

        // Links
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors"
          >
            {children}
          </a>
        ),

        // Tables
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse border border-white/10">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-white/5">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="border border-white/10 px-4 py-2 text-left font-semibold text-gray-100">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-white/10 px-4 py-2 text-gray-200">
            {children}
          </td>
        ),

        // Horizontal rule
        hr: () => (
          <hr className="border-white/10 my-6" />
        ),

        // Strong/Bold
        strong: ({ children }) => (
          <strong className="font-semibold text-white">{children}</strong>
        ),

        // Emphasis/Italic
        em: ({ children }) => (
          <em className="italic text-gray-100">{children}</em>
        ),
      }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
