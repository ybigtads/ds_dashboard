'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const components: Components = {
  // 제목
  h1: ({ children }) => (
    <h1 className="md-h1">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="md-h2">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="md-h3">{children}</h3>
  ),
  h4: ({ children }) => (
    <h4 className="md-h4">{children}</h4>
  ),

  // 단락 및 텍스트
  p: ({ children }) => (
    <p className="md-p">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="md-strong">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="md-em">{children}</em>
  ),

  // 리스트
  ul: ({ children }) => (
    <ul className="md-ul">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="md-ol">{children}</ol>
  ),
  li: ({ children }) => (
    <li className="md-li">{children}</li>
  ),

  // 코드
  code: ({ className, children, ...props }) => {
    const isInline = !className;
    if (isInline) {
      return <code className="md-code-inline" {...props}>{children}</code>;
    }
    return <code className={`md-code-block ${className || ''}`} {...props}>{children}</code>;
  },
  pre: ({ children }) => (
    <pre className="md-pre">{children}</pre>
  ),

  // 인용문
  blockquote: ({ children }) => (
    <blockquote className="md-blockquote">{children}</blockquote>
  ),

  // 테이블
  table: ({ children }) => (
    <div className="md-table-wrapper">
      <table className="md-table">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="md-thead">{children}</thead>
  ),
  tbody: ({ children }) => (
    <tbody className="md-tbody">{children}</tbody>
  ),
  tr: ({ children }) => (
    <tr className="md-tr">{children}</tr>
  ),
  th: ({ children }) => (
    <th className="md-th">{children}</th>
  ),
  td: ({ children }) => (
    <td className="md-td">{children}</td>
  ),

  // 링크 및 이미지
  a: ({ href, children }) => (
    <a href={href} className="md-a" target="_blank" rel="noopener noreferrer">{children}</a>
  ),
  img: ({ src, alt }) => (
    <img src={src} alt={alt || ''} className="md-img" />
  ),

  // 수평선
  hr: () => (
    <hr className="md-hr" />
  ),
};

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
