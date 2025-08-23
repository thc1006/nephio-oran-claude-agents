import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import { lazy, Suspense, memo, useMemo, useCallback } from 'react';

import styles from './index.module.css';

// Lazy load the HomepageFeatures component for better initial page load
const HomepageFeatures = lazy(() => import('@site/src/components/HomepageFeatures'));

// Loading component for lazy-loaded features
const FeaturesLoading = () => (
  <div className="features-loading" style={{ textAlign: 'center', padding: '2rem' }}>
    <div style={{ display: 'inline-block', width: '20px', height: '20px', border: '3px solid #f3f3f3', borderTop: '3px solid #25c2a0', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    <p>Loading features...</p>
  </div>
);

const HomepageHeader = memo(function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  
  // Memoize the button click handler
  const handleGetStarted = useCallback(() => {
    // Pre-load the docs route for better UX
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        import('@docusaurus/router').then(() => {
          // Pre-warm the route but don't navigate yet
        });
      });
    }
  }, []);

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className='container'>
        <Heading as='h1' className='hero__title'>
          {siteConfig.title}
        </Heading>
        <p className='hero__subtitle'>{siteConfig.tagline}</p>
        <div className={styles.buttons}>
          <Link 
            className='button button--secondary button--lg' 
            to='docs/intro'
            onMouseEnter={handleGetStarted}
          >
            Get Started with Nephio O-RAN Claude Agents - 5min Setup ⏱️
          </Link>
        </div>
      </div>
    </header>
  );
});

const Home = memo(function Home(): React.ReactElement {
  const { siteConfig } = useDocusaurusContext();
  
  // Memoize layout props
  const layoutProps = useMemo(() => ({
    title: `${siteConfig.title} - Cloud-Native O-RAN Orchestration`,
    description: 'Intelligent orchestration for cloud-native O-RAN deployments using AI-powered Claude agents. Full O-RAN L Release support with Nephio R5 integration for 5G network automation.'
  }), [siteConfig.title]);

  return (
    <Layout {...layoutProps}>
      <HomepageHeader />
      <main>
        <Suspense fallback={<FeaturesLoading />}>
          <HomepageFeatures />
        </Suspense>
      </main>
    </Layout>
  );
});

export default Home;
