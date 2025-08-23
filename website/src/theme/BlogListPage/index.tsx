import React from 'react';
import BlogListPage from '@theme-original/BlogListPage';
import type BlogListPageType from '@theme/BlogListPage';
import type { WrapperProps } from '@docusaurus/types';
import Head from '@docusaurus/Head';

type Props = WrapperProps<typeof BlogListPageType>;

export default function BlogListPageWrapper(props: Props): JSX.Element {
  // Generate structured data for blog landing page
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Nephio O-RAN Claude Agents Blog',
    description:
      'Expert insights on O-RAN L Release, Nephio R5 integration, AI-powered automation, and cloud-native 5G network orchestration. Latest updates on intelligent telco infrastructure.',
    url: 'https://thc1006.github.io/nephio-oran-claude-agents/blog',
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
        name: 'O-RAN L Release',
        description: 'Latest Open RAN specification release',
      },
      {
        '@type': 'Thing',
        name: 'Nephio R5',
        description: 'Cloud-native network automation platform version 5',
      },
      {
        '@type': 'Thing',
        name: 'Claude Agents',
        description: 'AI-powered orchestration and automation agents',
      },
      {
        '@type': 'Thing',
        name: 'Kubernetes',
        description: 'Container orchestration platform',
      },
    ],
    audience: {
      '@type': 'Audience',
      audienceType:
        'Telecommunications Engineers, Cloud-Native Developers, 5G Network Operators, DevOps Engineers',
    },
    inLanguage: 'en-US',
    potentialAction: {
      '@type': 'ReadAction',
      target: 'https://thc1006.github.io/nephio-oran-claude-agents/blog',
    },
  };

  return (
    <>
      <Head>
        <title>
          Nephio O-RAN Claude Agents Blog - Cloud-Native 5G Orchestration
        </title>
        <meta
          name='description'
          content='Expert insights on O-RAN L Release, Nephio R5 integration, AI-powered automation, and cloud-native 5G network orchestration. Latest updates on intelligent telco infrastructure.'
        />
        <script type='application/ld+json'>
          {JSON.stringify(structuredData)}
        </script>
        <meta property='og:type' content='website' />
        <meta
          property='og:title'
          content='Nephio O-RAN Claude Agents Blog - Cloud-Native 5G Orchestration'
        />
        <meta
          property='og:description'
          content='Expert insights on O-RAN L Release, Nephio R5 integration, AI-powered automation, and cloud-native 5G network orchestration. Latest updates on intelligent telco infrastructure.'
        />
        <meta
          property='og:url'
          content='https://thc1006.github.io/nephio-oran-claude-agents/blog'
        />
        <meta
          property='og:image'
          content='https://thc1006.github.io/nephio-oran-claude-agents/img/docusaurus-social-card.jpg'
        />
        <meta property='og:image:width' content='1200' />
        <meta property='og:image:height' content='630' />
        <meta name='twitter:card' content='summary_large_image' />
        <meta
          name='twitter:title'
          content='Nephio O-RAN Claude Agents Blog - Cloud-Native 5G Orchestration'
        />
        <meta
          name='twitter:description'
          content='Expert insights on O-RAN L Release, Nephio R5 integration, AI-powered automation, and cloud-native 5G network orchestration.'
        />
        <meta
          name='twitter:image'
          content='https://thc1006.github.io/nephio-oran-claude-agents/img/docusaurus-social-card.jpg'
        />
        <link
          rel='canonical'
          href='https://thc1006.github.io/nephio-oran-claude-agents/blog'
        />
        <link
          rel='alternate'
          type='application/rss+xml'
          title='Nephio O-RAN Claude Agents Blog RSS'
          href='https://thc1006.github.io/nephio-oran-claude-agents/blog/rss.xml'
        />
        <link
          rel='alternate'
          type='application/atom+xml'
          title='Nephio O-RAN Claude Agents Blog Atom'
          href='https://thc1006.github.io/nephio-oran-claude-agents/blog/atom.xml'
        />
        <meta
          name='keywords'
          content='O-RAN L Release, Nephio R5, cloud-native orchestration, AI automation, multi-cluster support, 5G networks, telecommunications, DevOps'
        />
      </Head>
      <BlogListPage {...props} />
    </>
  );
}
