import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';
import { memo, useMemo } from 'react';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: React.ReactElement;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Easy to Use',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        Docusaurus was designed from the ground up to be easily installed and
        used to get your website up and running quickly.
      </>
    ),
  },
  {
    title: 'Focus on What Matters',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Docusaurus lets you focus on your docs, and we&apos;ll do the chores. Go
        ahead and move your docs into the <code>docs</code> directory.
      </>
    ),
  },
  {
    title: 'Powered by React',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Extend or customize your website layout by reusing React. Docusaurus can
        be extended while reusing the same header and footer.
      </>
    ),
  },
];

const Feature = memo(function Feature({ title, Svg, description }: FeatureItem) {
  // Generate test ID based on title - memoized for performance
  const testId = useMemo(() => {
    if (title.includes('Easy')) return 'mountain-svg';
    if (title.includes('Focus')) return 'tree-svg';
    if (title.includes('React')) return 'react-svg';
    return `${title.toLowerCase().replace(/\s+/g, '-')}-svg`;
  }, [title]);

  return (
    <div className={clsx('col col--4')}>
      <div className='text--center'>
        <Svg
          className={styles.featureSvg}
          role='img'
          data-testid={testId}
          aria-label={`${title} illustration`}
        />
      </div>
      <div className='text--center padding-horiz--md'>
        <Heading as='h3'>{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
});

const HomepageFeatures = memo(function HomepageFeatures(): React.ReactElement {
  // Memoize the feature list mapping to avoid re-computation
  const features = useMemo(() => 
    FeatureList.map((props, idx) => (
      <Feature key={`feature-${idx}`} {...props} />
    )),
    []
  );

  return (
    <section className={styles.features}>
      <div className='container'>
        <div className='row'>
          {features}
        </div>
      </div>
    </section>
  );
});

export default HomepageFeatures;
