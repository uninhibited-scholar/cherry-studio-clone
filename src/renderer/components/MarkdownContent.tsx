import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

type Props = {
  content: string
}

export function MarkdownContent({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        // Code blocks
        pre: ({ children, ...props }) => (
          <pre
            {...props}
            style={{
              background: '#0d1117',
              borderRadius: 8,
              padding: '12px 16px',
              overflowX: 'auto',
              fontSize: 13,
              lineHeight: 1.5,
              margin: '8px 0'
            }}
          >
            {children}
          </pre>
        ),
        // Inline code
        code: ({ children, className: cls, ...props }) => {
          const isBlock = cls?.startsWith('language-')
          if (isBlock) return <code className={cls} {...props}>{children}</code>
          return (
            <code
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 4,
                padding: '1px 6px',
                fontSize: '0.9em',
                fontFamily: 'ui-monospace, monospace'
              }}
            >
              {children}
            </code>
          )
        },
        // Tables
        table: ({ children }) => (
          <div style={{ overflowX: 'auto', margin: '8px 0' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th style={{ border: '1px solid #3f3f46', padding: '6px 12px', background: '#27272a', textAlign: 'left' }}>
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td style={{ border: '1px solid #3f3f46', padding: '6px 12px' }}>{children}</td>
        ),
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote
            style={{
              borderLeft: '3px solid #3f3f46',
              margin: '8px 0',
              paddingLeft: 16,
              color: '#a1a1aa'
            }}
          >
            {children}
          </blockquote>
        ),
        // Links
        a: ({ href, children }) => (
          <a href={href} style={{ color: '#60a5fa', textDecoration: 'underline' }} target="_blank" rel="noreferrer">
            {children}
          </a>
        ),
        // Paragraphs
        p: ({ children }) => <p style={{ margin: '4px 0', lineHeight: 1.7 }}>{children}</p>,
        // Lists
        ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: '4px 0' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ paddingLeft: 20, margin: '4px 0' }}>{children}</ol>,
        li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
        // Headings
        h1: ({ children }) => <h1 style={{ fontSize: 20, fontWeight: 700, margin: '12px 0 6px', color: '#fafafa' }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ fontSize: 17, fontWeight: 700, margin: '10px 0 4px', color: '#fafafa' }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ fontSize: 15, fontWeight: 600, margin: '8px 0 4px', color: '#fafafa' }}>{children}</h3>,
        // Horizontal rule
        hr: () => <hr style={{ border: 'none', borderTop: '1px solid #3f3f46', margin: '12px 0' }} />
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
