// Docusaurus core utilities type declarations
import * as React from 'react';

declare module '@docusaurus/Link' {
  export interface LinkProps {
    to?: string;
    href?: string;
    children?: React.ReactNode;
    className?: string;
    activeClassName?: string;
    isNavLink?: boolean;
    [key: string]: any;
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

declare module '@docusaurus/router' {
  export { useHistory, useLocation, Redirect } from 'react-router-dom';
}

declare module '@docusaurus/Head' {
  const Head: React.ComponentType<{ children?: React.ReactNode }>;
  export default Head;
}

declare module '@docusaurus/Translate' {
  export interface TranslateProps {
    children: string;
    id?: string;
    description?: string;
    values?: { [key: string]: any };
  }

  const Translate: React.ComponentType<TranslateProps>;
  export default Translate;

  export function translate(
    param: {
      id?: string;
      message: string;
      description?: string;
    },
    values?: { [key: string]: any }
  ): string;
}

declare module '@docusaurus/useBaseUrl' {
  export default function useBaseUrl(url: string, options?: { absolute?: boolean }): string;
}

declare module '@docusaurus/BrowserOnly' {
  export interface BrowserOnlyProps {
    children: () => React.ReactElement;
    fallback?: React.ReactElement;
  }

  const BrowserOnly: React.ComponentType<BrowserOnlyProps>;
  export default BrowserOnly;
}

declare module '@docusaurus/ExecutionEnvironment' {
  export const canUseDOM: boolean;
  export const canUseEventListeners: boolean;
  export const canUseIntersectionObserver: boolean;
  export const canUseViewport: boolean;
}

declare module '@docusaurus/constants' {
  export const DEFAULT_PLUGIN_ID: string;
}

declare module '@site/src/components/*' {
  const Component: React.ComponentType<any>;
  export default Component;
}

declare module '@site/static/*' {
  const content: string;
  export default content;
}