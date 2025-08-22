import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

export default function NotFound(): React.ReactElement {
  return (
    <>
      <PageMetadata
        title={translate({
          id: 'theme.NotFound.title',
          message: '找不到頁面',
        })}
      />
      <HtmlClassNameProvider
        className={clsx(
          ThemeClassNames.wrapper.notFound,
          ThemeClassNames.page.notFoundPage,
        )}>
        <Layout>
          <main className="container margin-vert--xl">
            <div className="row">
              <div className="col col--6 col--offset-3">
                <Heading as="h1" className="hero__title">
                  <Translate
                    id="theme.NotFound.title"
                    description="The title of the 404 page">
                    找不到頁面
                  </Translate>
                </Heading>
                <p>
                  <Translate
                    id="theme.NotFound.p1"
                    description="The first paragraph of the 404 page">
                    很抱歉，我們找不到您要尋找的頁面。
                  </Translate>
                </p>
                <p>
                  <Translate
                    id="theme.NotFound.p2"
                    description="The 2nd paragraph of the 404 page">
                    請檢查網址是否正確，或回到首頁瀏覽我們的 O-RAN 技術文件。
                  </Translate>
                </p>
                <div style={{textAlign: 'center', marginTop: '2rem'}}>
                  <Link
                    className="button button--primary button--lg"
                    to="/zh-TW/">
                    返回首頁
                  </Link>
                  <Link
                    className="button button--secondary button--lg margin-left--md"
                    to="/zh-TW/docs/intro">
                    瀏覽文件
                  </Link>
                </div>
              </div>
            </div>
          </main>
        </Layout>
      </HtmlClassNameProvider>
    </>
  );
}