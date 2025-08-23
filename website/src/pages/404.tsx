import React, { useEffect, useState } from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import { useLocation } from '@docusaurus/router';
import { URLSanitizer } from '../theme/Root';

export default function NotFound() {
  const location = useLocation();
  const [sanitizedUrl, setSanitizedUrl] = useState<string>('');
  const [isSecurityWarning, setIsSecurityWarning] = useState<boolean>(false);

  useEffect(() => {
    const currentUrl = location.pathname + location.search + location.hash;

    // Check if this is a security-related 404 (from malformed URL detection)
    const urlParams = new URLSearchParams(location.search);
    const isSecurityError = urlParams.get('error') === 'malformed_url';
    setIsSecurityWarning(isSecurityError);

    // Sanitize the current URL for display
    const sanitized = URLSanitizer.sanitize(currentUrl);
    setSanitizedUrl(sanitized);

    // Log security incidents
    if (isSecurityError || URLSanitizer.isDangerous(currentUrl)) {
      console.warn(
        '[Security] 404 page accessed with potentially malicious URL:',
        {
          originalUrl: currentUrl,
          sanitizedUrl: sanitized,
          timestamp: new Date().toISOString(),
          referrer: document.referrer,
        }
      );
    }
  }, [location]);

  return (
    <Layout
      title='Page Not Found'
      description='The page you are looking for could not be found.'
    >
      <main className='container margin-vert--xl'>
        <div className='row'>
          <div className='col col--6 col--offset-3'>
            {isSecurityWarning ? (
              <>
                <h1 className='hero__title' style={{ color: '#d73a49' }}>
                  ⚠️ Security Warning
                </h1>
                <div
                  className='alert alert--danger'
                  style={{ marginBottom: '2rem' }}
                >
                  <h4>Malicious URL Detected</h4>
                  <p>
                    The URL you attempted to access contained potentially
                    dangerous patterns that could be used for cross-site
                    scripting (XSS) attacks. For your security, you have been
                    redirected to this safe page.
                  </p>
                </div>
                <p>
                  <strong>What happened?</strong> Our security system detected
                  suspicious patterns in the URL that could potentially execute
                  malicious code in your browser.
                </p>
                <p>
                  <strong>What should you do?</strong> If you believe you
                  reached this page in error, please contact the site
                  administrator. Otherwise, you can safely continue to our
                  homepage.
                </p>
              </>
            ) : (
              <>
                <h1 className='hero__title'>404 - Page Not Found</h1>
                <p>We could not find what you were looking for.</p>
                {sanitizedUrl && sanitizedUrl !== '/404' && (
                  <div
                    className='alert alert--secondary'
                    style={{ marginBottom: '1rem' }}
                  >
                    <strong>Requested URL:</strong>{' '}
                    <code
                      style={{
                        wordBreak: 'break-all',
                        background: '#f6f8fa',
                        padding: '0.2em 0.4em',
                        borderRadius: '3px',
                        fontSize: '0.85em',
                      }}
                    >
                      {sanitizedUrl}
                    </code>
                  </div>
                )}
                <p>
                  Please contact the owner of the site that linked you to the
                  original URL and let them know their link is broken.
                </p>
              </>
            )}

            <div style={{ marginTop: '2rem' }}>
              <Link
                className='button button--primary button--lg'
                to='/'
                style={{ marginRight: '1rem' }}
              >
                Return to Homepage
              </Link>
              <Link className='button button--secondary button--lg' to='/docs'>
                Browse Documentation
              </Link>
            </div>

            {/* Additional security information */}
            <details style={{ marginTop: '2rem', fontSize: '0.9em' }}>
              <summary style={{ cursor: 'pointer', color: '#666' }}>
                Security Information
              </summary>
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #e1e4e8',
                }}
              >
                <p>
                  <strong>Our Security Features:</strong>
                </p>
                <ul>
                  <li>Real-time URL pattern analysis</li>
                  <li>XSS attack prevention</li>
                  <li>Malicious content filtering</li>
                  <li>Safe URL sanitization</li>
                </ul>
                <p style={{ marginBottom: 0 }}>
                  If you believe you've encountered a security issue, please
                  report it to our security team.
                </p>
              </div>
            </details>
          </div>
        </div>
      </main>
    </Layout>
  );
}
