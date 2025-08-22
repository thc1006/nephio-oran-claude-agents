import React from 'react';
import { render, screen } from '@testing-library/react';
import NotFound from '../../src/pages/404';

// Mock Docusaurus components
jest.mock('@theme/Layout', () => {
  return function MockLayout({ title, description, children }: any) {
    return (
      <div data-testid="layout" data-title={title} data-description={description}>
        {children}
      </div>
    );
  };
});

jest.mock('@docusaurus/Link', () => {
  return function MockLink({ to, className, children, ...props }: any) {
    return (
      <a href={to} className={className} data-testid="home-link" {...props}>
        {children}
      </a>
    );
  };
});

describe('404 Page', () => {
  it('renders the 404 page with correct content', () => {
    render(<NotFound />);
    
    // Check main heading
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('404 - Page Not Found');
    
    // Check error messages
    expect(screen.getByText('We could not find what you were looking for.')).toBeInTheDocument();
    expect(screen.getByText(/Please contact the owner of the site/)).toBeInTheDocument();
    
    // Check return link (there might be multiple due to nesting, get the one with button classes)
    const returnLinks = screen.getAllByTestId('home-link');
    const buttonLink = returnLinks.find(link => link.className.includes('button'));
    expect(buttonLink).toHaveAttribute('href', '/');
    expect(buttonLink).toHaveTextContent('Return to Homepage');
    expect(buttonLink).toHaveClass('button', 'button--primary', 'button--lg');
  });

  it('uses correct Layout props', () => {
    render(<NotFound />);
    
    const layout = screen.getByTestId('layout');
    expect(layout).toHaveAttribute('data-title', 'Page Not Found');
    expect(layout).toHaveAttribute('data-description', 'The page you are looking for could not be found.');
  });

  it('has proper semantic structure', () => {
    render(<NotFound />);
    
    const main = screen.getByRole('main');
    expect(main).toHaveClass('container', 'margin-vert--xl');
    
    // Check Bootstrap grid classes are applied
    const row = main.querySelector('.row');
    expect(row).toBeInTheDocument();
    
    const col = row?.querySelector('.col');
    expect(col).toHaveClass('col--6', 'col--offset-3');
  });

  it('has accessible heading hierarchy', () => {
    render(<NotFound />);
    
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveClass('hero__title');
    expect(heading).toHaveTextContent('404 - Page Not Found');
  });

  it('provides helpful error message and guidance', () => {
    render(<NotFound />);
    
    // Check that all expected text content is present
    expect(screen.getByText('We could not find what you were looking for.')).toBeInTheDocument();
    expect(screen.getByText(/Please contact the owner of the site that linked you to the original URL/)).toBeInTheDocument();
    expect(screen.getByText(/let them know their link is broken/)).toBeInTheDocument();
  });

  it('provides navigation back to homepage', () => {
    render(<NotFound />);
    
    const homeLink = screen.getByText('Return to Homepage');
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });
});