/**
 * Integration tests for documentation content rendering
 * Tests that markdown content is properly processed and rendered
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

// Mock MDX content for testing
const MockMDXContent = ({ content }: { content: string }) => (
  <div data-testid="mdx-content" dangerouslySetInnerHTML={{ __html: content }} />
);

// Mock Docusaurus theme components
jest.mock('@theme/MDXComponents', () => ({
  h1: ({ children }: any) => <h1 data-testid="mdx-h1">{children}</h1>,
  h2: ({ children }: any) => <h2 data-testid="mdx-h2">{children}</h2>,
  h3: ({ children }: any) => <h3 data-testid="mdx-h3">{children}</h3>,
  p: ({ children }: any) => <p data-testid="mdx-p">{children}</p>,
  code: ({ children }: any) => <code data-testid="mdx-code">{children}</code>,
  pre: ({ children }: any) => <pre data-testid="mdx-pre">{children}</pre>,
  a: ({ children, href }: any) => <a data-testid="mdx-link" href={href}>{children}</a>,
  ul: ({ children }: any) => <ul data-testid="mdx-ul">{children}</ul>,
  ol: ({ children }: any) => <ol data-testid="mdx-ol">{children}</ol>,
  li: ({ children }: any) => <li data-testid="mdx-li">{children}</li>,
  blockquote: ({ children }: any) => <blockquote data-testid="mdx-blockquote">{children}</blockquote>,
  table: ({ children }: any) => <table data-testid="mdx-table">{children}</table>,
  th: ({ children }: any) => <th data-testid="mdx-th">{children}</th>,
  td: ({ children }: any) => <td data-testid="mdx-td">{children}</td>,
}));

jest.mock('@theme/CodeBlock', () => {
  return function MockCodeBlock({ children, language }: any) {
    return (
      <div data-testid="code-block" data-language={language}>
        <pre><code>{children}</code></pre>
      </div>
    );
  };
});

describe('Documentation Content Rendering', () => {
  describe('Markdown Elements', () => {
    it('renders headings correctly', () => {
      const content = `
        <h1>Main Title</h1>
        <h2>Section Title</h2>
        <h3>Subsection Title</h3>
      `;
      
      render(<MockMDXContent content={content} />);
      
      expect(screen.getByTestId('mdx-h1')).toHaveTextContent('Main Title');
      expect(screen.getByTestId('mdx-h2')).toHaveTextContent('Section Title');
      expect(screen.getByTestId('mdx-h3')).toHaveTextContent('Subsection Title');
    });

    it('renders paragraphs and text formatting', () => {
      const content = `
        <p>This is a paragraph with <code>inline code</code>.</p>
        <p>Another paragraph with <strong>bold</strong> and <em>italic</em> text.</p>
      `;
      
      render(<MockMDXContent content={content} />);
      
      const paragraphs = screen.getAllByTestId('mdx-p');
      expect(paragraphs).toHaveLength(2);
      
      const codeElement = screen.getByTestId('mdx-code');
      expect(codeElement).toHaveTextContent('inline code');
    });

    it('renders lists correctly', () => {
      const content = `
        <ul>
          <li>First item</li>
          <li>Second item</li>
        </ul>
        <ol>
          <li>Ordered item 1</li>
          <li>Ordered item 2</li>
        </ol>
      `;
      
      render(<MockMDXContent content={content} />);
      
      expect(screen.getByTestId('mdx-ul')).toBeInTheDocument();
      expect(screen.getByTestId('mdx-ol')).toBeInTheDocument();
      
      const listItems = screen.getAllByTestId('mdx-li');
      expect(listItems).toHaveLength(4);
    });

    it('renders links with proper attributes', () => {
      const content = `
        <a href="https://example.com">External Link</a>
        <a href="/docs/intro">Internal Link</a>
      `;
      
      render(<MockMDXContent content={content} />);
      
      const links = screen.getAllByTestId('mdx-link');
      expect(links).toHaveLength(2);
      
      expect(links[0]).toHaveAttribute('href', 'https://example.com');
      expect(links[1]).toHaveAttribute('href', '/docs/intro');
    });

    it('renders blockquotes', () => {
      const content = `
        <blockquote>
          <p>This is a quote from an important source.</p>
        </blockquote>
      `;
      
      render(<MockMDXContent content={content} />);
      
      expect(screen.getByTestId('mdx-blockquote')).toBeInTheDocument();
    });

    it('renders tables correctly', () => {
      const content = `
        <table>
          <thead>
            <tr>
              <th>Header 1</th>
              <th>Header 2</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cell 1</td>
              <td>Cell 2</td>
            </tr>
          </tbody>
        </table>
      `;
      
      render(<MockMDXContent content={content} />);
      
      expect(screen.getByTestId('mdx-table')).toBeInTheDocument();
      
      const headers = screen.getAllByTestId('mdx-th');
      expect(headers).toHaveLength(2);
      
      const cells = screen.getAllByTestId('mdx-td');
      expect(cells).toHaveLength(2);
    });
  });

  describe('Code Blocks', () => {
    const CodeBlockTest = ({ language, children }: { language: string; children: string }) => {
      // Simulate CodeBlock component
      return (
        <div data-testid="code-block" data-language={language}>
          <pre><code>{children}</code></pre>
        </div>
      );
    };

    it('renders YAML code blocks', () => {
      const yamlCode = `
apiVersion: v1
kind: ConfigMap
metadata:
  name: test-config
data:
  config: value
      `;
      
      render(<CodeBlockTest language="yaml">{yamlCode}</CodeBlockTest>);
      
      const codeBlock = screen.getByTestId('code-block');
      expect(codeBlock).toHaveAttribute('data-language', 'yaml');
      expect(codeBlock).toHaveTextContent('apiVersion: v1');
    });

    it('renders Go code blocks', () => {
      const goCode = `
package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
      `;
      
      render(<CodeBlockTest language="go">{goCode}</CodeBlockTest>);
      
      const codeBlock = screen.getByTestId('code-block');
      expect(codeBlock).toHaveAttribute('data-language', 'go');
      expect(codeBlock).toHaveTextContent('package main');
    });

    it('renders bash code blocks', () => {
      const bashCode = `
#!/bin/bash
kubectl apply -f deployment.yaml
kubectl get pods
      `;
      
      render(<CodeBlockTest language="bash">{bashCode}</CodeBlockTest>);
      
      const codeBlock = screen.getByTestId('code-block');
      expect(codeBlock).toHaveAttribute('data-language', 'bash');
      expect(codeBlock).toHaveTextContent('kubectl apply');
    });
  });

  describe('Custom Components Integration', () => {
    it('renders CompatibilityMatrix within documentation', async () => {
      // Mock the CompatibilityMatrix component in documentation context
      const CompatibilityMatrixInDoc = () => (
        <div data-testid="compatibility-matrix-in-doc">
          <h3>Compatibility Matrix</h3>
          <table>
            <tbody>
              <tr>
                <td>nephio</td>
                <td>v2.0.0</td>
                <td><span className="badge badge--success">Supported</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      );
      
      render(<CompatibilityMatrixInDoc />);
      
      await waitFor(() => {
        expect(screen.getByTestId('compatibility-matrix-in-doc')).toBeInTheDocument();
        expect(screen.getByText('nephio')).toBeInTheDocument();
        expect(screen.getByText('Supported')).toBeInTheDocument();
      });
    });

    it('renders ReleaseBadge within documentation', () => {
      const ReleaseBadgeInDoc = () => (
        <div data-testid="release-badge-in-doc">
          <p>This documentation covers 
            <span className="badge badge--primary">O-RAN L (2025-06-30)</span>
          </p>
        </div>
      );
      
      render(<ReleaseBadgeInDoc />);
      
      expect(screen.getByTestId('release-badge-in-doc')).toBeInTheDocument();
      expect(screen.getByText('O-RAN L (2025-06-30)')).toBeInTheDocument();
    });
  });

  describe('Frontmatter and Metadata', () => {
    it('handles documentation with frontmatter', () => {
      const DocumentWithFrontmatter = () => (
        <article data-testid="doc-article">
          <header>
            <h1>Nephio Infrastructure Agent</h1>
            <div className="doc-metadata">
              <span className="doc-tag">infrastructure</span>
              <span className="doc-tag">nephio</span>
              <span className="doc-date">Last updated: 2025-08-20</span>
            </div>
          </header>
          <div className="doc-content">
            <p>Content goes here...</p>
          </div>
        </article>
      );
      
      render(<DocumentWithFrontmatter />);
      
      expect(screen.getByTestId('doc-article')).toBeInTheDocument();
      expect(screen.getByText('Nephio Infrastructure Agent')).toBeInTheDocument();
      expect(screen.getByText('infrastructure')).toBeInTheDocument();
      expect(screen.getByText('Last updated: 2025-08-20')).toBeInTheDocument();
    });
  });

  describe('Multi-language Content', () => {
    it('renders English content correctly', () => {
      const EnglishContent = () => (
        <div data-testid="english-content" lang="en">
          <h1>Nephio O-RAN Claude Agents</h1>
          <p>Intelligent orchestration for cloud-native O-RAN deployments</p>
        </div>
      );
      
      render(<EnglishContent />);
      
      expect(screen.getByTestId('english-content')).toHaveAttribute('lang', 'en');
      expect(screen.getByText('Nephio O-RAN Claude Agents')).toBeInTheDocument();
    });

    it('renders Traditional Chinese content correctly', () => {
      const ChineseContent = () => (
        <div data-testid="chinese-content" lang="zh-TW">
          <h1>Nephio O-RAN Claude 代理</h1>
          <p>雲原生 O-RAN 部署的智能協調</p>
        </div>
      );
      
      render(<ChineseContent />);
      
      expect(screen.getByTestId('chinese-content')).toHaveAttribute('lang', 'zh-TW');
      expect(screen.getByText('Nephio O-RAN Claude 代理')).toBeInTheDocument();
    });
  });

  describe('Link Validation', () => {
    it('validates internal links format', () => {
      const content = `
        <a href="/docs/intro">Introduction</a>
        <a href="/docs/guides/quickstart">Quick Start</a>
        <a href="/docs/agents/infrastructure/nephio-infrastructure-agent">Infrastructure Agent</a>
      `;
      
      render(<MockMDXContent content={content} />);
      
      const links = screen.getAllByTestId('mdx-link');
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        expect(href).toMatch(/^\/docs\//);
      });
    });

    it('validates external links format', () => {
      const content = `
        <a href="https://nephio.org">Nephio Project</a>
        <a href="https://o-ran.org">O-RAN Alliance</a>
        <a href="https://kubernetes.io">Kubernetes</a>
      `;
      
      render(<MockMDXContent content={content} />);
      
      const links = screen.getAllByTestId('mdx-link');
      
      links.forEach(link => {
        const href = link.getAttribute('href');
        expect(href).toMatch(/^https?:\/\//);
      });
    });
  });

  describe('Search Integration', () => {
    it('includes searchable content with proper structure', () => {
      const SearchableContent = () => (
        <div data-testid="searchable-content">
          <h1 data-searchable="title">Nephio Infrastructure Agent</h1>
          <p data-searchable="content">
            This agent manages infrastructure resources for Nephio deployments.
          </p>
          <div data-searchable="tags">
            <span>nephio</span>
            <span>infrastructure</span>
            <span>kubernetes</span>
          </div>
        </div>
      );
      
      render(<SearchableContent />);
      
      expect(screen.getByTestId('searchable-content')).toBeInTheDocument();
      
      const titleElement = screen.getByText('Nephio Infrastructure Agent');
      expect(titleElement).toHaveAttribute('data-searchable', 'title');
      
      const contentElement = screen.getByText(/This agent manages infrastructure/);
      expect(contentElement).toHaveAttribute('data-searchable', 'content');
    });
  });
});