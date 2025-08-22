import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function NotFound() {
  return (
    <Layout
      title='Page Not Found'
      description='The page you are looking for could not be found.'
    >
      <main className='container margin-vert--xl'>
        <div className='row'>
          <div className='col col--6 col--offset-3'>
            <h1 className='hero__title'>404 - Page Not Found</h1>
            <p>We could not find what you were looking for.</p>
            <p>
              Please contact the owner of the site that linked you to the
              original URL and let them know their link is broken.
            </p>
            <Link className='button button--primary button--lg' to='/'>
              Return to Homepage
            </Link>
          </div>
        </div>
      </main>
    </Layout>
  );
}
