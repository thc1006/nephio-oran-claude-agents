import React from 'react';
import BlogPostPage from '@theme-original/BlogPostPage';
import type { WrapperProps } from '@docusaurus/types';
import Head from '@docusaurus/Head';

type Props = WrapperProps<typeof BlogPostPage>;

export default function BlogPostPageWrapper(props: Props): JSX.Element {
  // Extract metadata from props instead of useDoc
  const metadata = (props as any)?.content?.metadata || {};
  const { title, description, permalink, date, authors = [] } = metadata;

  // Generate structured data for blog post
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    description: description,
    url: `https://thc1006.github.io/nephio-oran-claude-agents${permalink}`,
    datePublished: date,
    dateModified: date,
    author: authors.map(
      (author: { name: string; url?: string; imageURL?: string }) => ({
        '@type': 'Person',
        name: author.name,
        url: author.url,
        image: author.imageURL,
      })
    ),
    publisher: {
      '@type': 'Organization',
      name: 'Nephio O-RAN Claude Agents',
      url: 'https://thc1006.github.io/nephio-oran-claude-agents/',
      logo: {
        '@type': 'ImageObject',
        url: 'https://thc1006.github.io/nephio-oran-claude-agents/img/logo.svg',
      },
    },
    about: [
      {
        '@type': 'Thing',
        name: 'O-RAN',
        description: 'Open Radio Access Network architecture',
      },
      {
        '@type': 'Thing',
        name: 'Nephio',
        description: 'Cloud-native network automation platform',
      },
      {
        '@type': 'Thing',
        name: 'Claude Agents',
        description: 'AI-powered orchestration agents',
      },
    ],
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://thc1006.github.io/nephio-oran-claude-agents${permalink}`,
    },
    audience: {
      '@type': 'Audience',
      audienceType:
        'Telecommunications Engineers, Cloud-Native Developers, 5G Network Operators',
    },
    keywords:
      'O-RAN L Release, Nephio R5, cloud-native orchestration, AI automation, multi-cluster support, 5G networks',
  };

  return (
    <>
      <Head>
        <script type='application/ld+json'>
          {JSON.stringify(structuredData)}
        </script>
        <meta property='og:type' content='article' />
        <meta property='og:title' content={title} />
        <meta property='og:description' content={description} />
        <meta
          property='og:url'
          content={`https://thc1006.github.io/nephio-oran-claude-agents${permalink}`}
        />
        <meta
          property='og:image'
          content='https://thc1006.github.io/nephio-oran-claude-agents/img/docusaurus-social-card.jpg'
        />
        <meta property='og:image:width' content='1200' />
        <meta property='og:image:height' content='630' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta name='twitter:title' content={title} />
        <meta name='twitter:description' content={description} />
        <meta
          name='twitter:image'
          content='https://thc1006.github.io/nephio-oran-claude-agents/img/docusaurus-social-card.jpg'
        />
        <link
          rel='canonical'
          href={`https://thc1006.github.io/nephio-oran-claude-agents${permalink}`}
        />
      </Head>
      <BlogPostPage {...props} />
    </>
  );
}
