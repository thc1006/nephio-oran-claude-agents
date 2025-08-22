import React from 'react';
import { render, screen } from '@testing-library/react';
import HomepageFeatures from '../../src/components/HomepageFeatures';

// Mock the Docusaurus Heading component
jest.mock('@theme/Heading', () => {
  return function MockHeading({ children, as: Component = 'h3', ...props }: any) {
    return React.createElement(Component, props, children);
  };
});

// Mock SVG imports
jest.mock('@site/static/img/undraw_docusaurus_mountain.svg', () => ({
  default: (props: any) => <svg data-testid="mountain-svg" {...props} />,
}));

jest.mock('@site/static/img/undraw_docusaurus_tree.svg', () => ({
  default: (props: any) => <svg data-testid="tree-svg" {...props} />,
}));

jest.mock('@site/static/img/undraw_docusaurus_react.svg', () => ({
  default: (props: any) => <svg data-testid="react-svg" {...props} />,
}));

describe('HomepageFeatures', () => {
  beforeEach(() => {
    render(<HomepageFeatures />);
  });

  it('renders all feature items', () => {
    expect(screen.getByText('Easy to Use')).toBeInTheDocument();
    expect(screen.getByText('Focus on What Matters')).toBeInTheDocument();
    expect(screen.getByText('Powered by React')).toBeInTheDocument();
  });

  it('renders feature descriptions', () => {
    expect(
      screen.getByText(/Docusaurus was designed from the ground up to be easily installed/)
    ).toBeInTheDocument();
    
    expect(
      screen.getByText(/Docusaurus lets you focus on your docs/)
    ).toBeInTheDocument();
    
    expect(
      screen.getByText(/Extend or customize your website layout by reusing React/)
    ).toBeInTheDocument();
  });

  it('renders SVG icons with correct roles', () => {
    const svgs = screen.getAllByRole('img');
    expect(svgs).toHaveLength(3);
    
    expect(screen.getByTestId('mountain-svg')).toBeInTheDocument();
    expect(screen.getByTestId('tree-svg')).toBeInTheDocument();
    expect(screen.getByTestId('react-svg')).toBeInTheDocument();
  });

  it('has proper container structure', () => {
    const section = screen.getByRole('region');
    expect(section).toHaveClass('features');
    
    const container = section.querySelector('.container');
    expect(container).toBeInTheDocument();
    
    const row = container?.querySelector('.row');
    expect(row).toBeInTheDocument();
  });

  it('renders features in responsive grid columns', () => {
    const features = screen.getAllByText(/Easy to Use|Focus on What Matters|Powered by React/);
    
    features.forEach((feature) => {
      const featureContainer = feature.closest('.col--4');
      expect(featureContainer).toBeInTheDocument();
    });
  });

  it('has accessible headings', () => {
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings).toHaveLength(3);
    
    expect(headings[0]).toHaveTextContent('Easy to Use');
    expect(headings[1]).toHaveTextContent('Focus on What Matters');
    expect(headings[2]).toHaveTextContent('Powered by React');
  });

  it('includes code element in the second feature description', () => {
    const codeElement = screen.getByText('docs');
    expect(codeElement.tagName).toBe('CODE');
  });

  it('centers text content appropriately', () => {
    const textCenterElements = document.querySelectorAll('.text--center');
    expect(textCenterElements.length).toBeGreaterThan(0);
  });
});