import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: React.ReactElement;
};

const FeatureList: FeatureItem[] = [
  {
    title: '智慧化 O-RAN 編排',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        運用 Claude AI 智慧代理技術，自動化管理 O-RAN 網路功能的部署與編排。
        從 RIC 平台到 xApps 應用，一站式解決複雜的電信級基礎設施管理需求。
      </>
    ),
  },
  {
    title: '專業電信解決方案',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        專為台灣電信產業設計的企業級平台。整合 Nephio、Kubernetes 與 O-RAN 標準，
        讓您專注於 <code>5G 網路創新</code> 而非繁瑣的基礎設施維護工作。
      </>
    ),
  },
  {
    title: '雲原生架構優勢',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        基於容器化與微服務架構，提供彈性擴展與高可用性。
        符合 CNF（Cloud Native Functions）標準，滿足電信級服務品質要求。
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): React.ReactElement {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}