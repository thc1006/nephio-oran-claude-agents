import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function NotFound() {
  return (
    <Layout
      title="找不到頁面"
      description="很抱歉，我們找不到您要尋找的頁面。">
      <main className="container margin-vert--xl">
        <div className="row">
          <div className="col col--6 col--offset-3">
            <h1 className="hero__title">404 - 找不到頁面</h1>
            <p>很抱歉，我們找不到您要尋找的頁面。</p>
            <p>
              請檢查網址是否正確，或回到首頁瀏覽我們的 O-RAN 技術文件。
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
  );
}