// Comprehensive Docusaurus type declarations
import * as React from 'react';

// CSS Modules
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.css' {
  const content: string;
  export default content;
}

// Docusaurus Core
declare module '@docusaurus/Link' {
  export interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    to?: string;
    href?: string;
    children?: React.ReactNode;
    className?: string;
    activeClassName?: string;
    isNavLink?: boolean;
  }

  const Link: React.ComponentType<LinkProps>;
  export default Link;
}

declare module '@docusaurus/useDocusaurusContext' {
  export interface DocusaurusContext {
    siteConfig: {
      title: string;
      tagline: string;
      favicon: string;
      url: string;
      baseUrl: string;
      organizationName?: string;
      projectName?: string;
      deploymentBranch?: string;
      githubHost?: string;
      plugins?: any[];
      themes?: any[];
      presets?: any[];
      themeConfig?: any;
      customFields?: { [key: string]: any };
      [key: string]: any;
    };
    isClient: boolean;
  }

  const useDocusaurusContext: () => DocusaurusContext;
  export default useDocusaurusContext;
}

declare module '@docusaurus/useBaseUrl' {
  export default function useBaseUrl(url: string, options?: { absolute?: boolean }): string;
}

declare module '@docusaurus/Head' {
  const Head: React.ComponentType<{ children?: React.ReactNode }>;
  export default Head;
}

declare module '@docusaurus/BrowserOnly' {
  export interface BrowserOnlyProps {
    children: () => React.ReactElement;
    fallback?: React.ReactElement;
  }

  const BrowserOnly: React.ComponentType<BrowserOnlyProps>;
  export default BrowserOnly;
}

// Docusaurus Theme Components
declare module '@theme/Layout' {
  export interface LayoutProps {
    children?: React.ReactNode;
    title?: string;
    description?: string;
    keywords?: string | string[];
    image?: string;
    wrapperClassName?: string;
    pageClassName?: string;
    searchMetadata?: {
      version?: string;
      tag?: string;
    };
  }

  const Layout: React.ComponentType<LayoutProps>;
  export default Layout;
}

declare module '@theme/Heading' {
  export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
    as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    id?: string;
    className?: string;
    children?: React.ReactNode;
  }

  const Heading: React.ComponentType<HeadingProps>;
  export default Heading;
}

declare module '@theme/Footer' {
  const Footer: React.ComponentType;
  export default Footer;
}

declare module '@theme/Navbar' {
  const Navbar: React.ComponentType;
  export default Navbar;
}

// Site Components
declare module '@site/src/components/*' {
  const Component: React.ComponentType<any>;
  export default Component;
}

declare module '@site/static/*' {
  const content: string;
  export default content;
}

// Additional utility modules
declare module '@docusaurus/router' {
  export { useHistory, useLocation, Redirect } from 'react-router-dom';
}

declare module '@docusaurus/constants' {
  export const DEFAULT_PLUGIN_ID: string;
}

declare module '@docusaurus/ExecutionEnvironment' {
  export const canUseDOM: boolean;
  export const canUseEventListeners: boolean;
  export const canUseIntersectionObserver: boolean;
  export const canUseViewport: boolean;
}