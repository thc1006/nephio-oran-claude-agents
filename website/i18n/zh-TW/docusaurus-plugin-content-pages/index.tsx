import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          Nephio O-RAN Claude 代理平台
        </Heading>
        <p className="hero__subtitle">智慧化雲原生 O-RAN 部署編排解決方案</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/zh-TW/docs/intro">
            立即開始 - 5分鐘快速上手 ⏱️
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): React.ReactElement {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`歡迎使用 ${siteConfig.title}`}
      description="領先業界的智慧化雲原生 O-RAN 部署編排平台。運用 Claude AI 代理技術實現電信級自動化管理，為台灣 5G 產業提供企業級解決方案。">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}