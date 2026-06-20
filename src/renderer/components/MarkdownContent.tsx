import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

type Props = {
  content: string
}

function CodeBlock({ children, className }: { children: React.ReactNode; className?: string }) {
  const [copied, setCopied] = useState(false)

  const getTextContent = (node: React.ReactNode): string => {
    if (typeof node === 'string') return node
    if (Array.isArray(node)) return node.map(getTextContent).join('')
    if (React.isValidElement(node) && node.props) return getTextContent((node.props as Record<string, unknown>).children as React.ReactNode)
    return ''
  }

  const copyCode = () => {
    const text = getTextContent(children)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const lang = className?.replace('language-', '') ?? ''

  return (
    <div style={{ position: 'relative', margin: '8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#161b22', borderRadius: '8px 8px 0 0', padding: '5px 12px' }}>
        <span style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace' }}>{lang || 'code'}</span>
        <button
          onClick={copyCode}
          style={{ background: 'none', border: '1px solid #3f3f46', borderRadius: 4, color: copied ? '#4ade80' : '#71717a', cursor: 'pointer', fontSize: 11, padding: '2px 8px' }}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
      <pre style={{ background: '#0d1117', borderRadius: '0 0 8px 8px', padding: '12px 16px', overflowX: 'auto', fontSize: 13, lineHeight: 1.5, margin: 0 }}>
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

export function MarkdownContent({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        pre: ({ children }) => {
          // Extract code element to get className and content
          const codeEl = React.Children.toArray(children).find(
            (c) => React.isValidElement(c) && c.type === 'code'
          ) as React.ReactElement | undefined
          return <CodeBlock className={codeEl?.props?.className}>{codeEl?.props?.children ?? children}</CodeBlock>
        },
        code: ({ children, className, ...props }) => {
          const isBlock = className?.startsWith('language-')
          if (isBlock) return <code className={className} {...props}>{children}</code>
          return (
            <code style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 4, padding: '1px 6px', fontSize: '0.9em', fontFamily: 'ui-monospace, monospace' }}>
              {children}
            </code>
          )
        },
        table: ({ children }) => (
          <div style={{ overflowX: 'auto', margin: '8px 0' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>{children}</table>
          </div>
        ),
        th: ({ children }) => <th style={{ border: '1px solid #3f3f46', padding: '6px 12px', background: '#27272a', textAlign: 'left' }}>{children}</th>,
        td: ({ children }) => <td style={{ border: '1px solid #3f3f46', padding: '6px 12px' }}>{children}</td>,
        blockquote: ({ children }) => (
          <blockquote style={{ borderLeft: '3px solid #3f3f46', margin: '8px 0', paddingLeft: 16, color: '#a1a1aa' }}>{children}</blockquote>
        ),
        a: ({ href, children }) => (
          <a href={href} style={{ color: '#60a5fa', textDecoration: 'underline' }} target="_blank" rel="noreferrer">{children}</a>
        ),
        p: ({ children }) => <p style={{ margin: '4px 0', lineHeight: 1.7 }}>{children}</p>,
        ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: '4px 0' }}>{children}</ul>,
        ol: ({ children }) => <ol style={{ paddingLeft: 20, margin: '4px 0' }}>{children}</ol>,
        li: ({ children }) => <li style={{ margin: '2px 0' }}>{children}</li>,
        h1: ({ children }) => <h1 style={{ fontSize: 20, fontWeight: 700, margin: '12px 0 6px', color: '#fafafa' }}>{children}</h1>,
        h2: ({ children }) => <h2 style={{ fontSize: 17, fontWeight: 700, margin: '10px 0 4px', color: '#fafafa' }}>{children}</h2>,
        h3: ({ children }) => <h3 style={{ fontSize: 15, fontWeight: 600, margin: '8px 0 4px', color: '#fafafa' }}>{children}</h3>,
        hr: () => <hr style={{ border: 'none', borderTop: '1px solid #3f3f46', margin: '12px 0' }} />
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
