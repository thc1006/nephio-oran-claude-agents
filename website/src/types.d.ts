// Additional Docusaurus type declarations not covered by @docusaurus/module-type-aliases
/// <reference path="../node_modules/@docusaurus/module-type-aliases/src/index.d.ts" />
/// <reference lib="dom" />
import * as React from 'react';

// URL Sanitization types
declare module '@theme/Root' {
  export interface RootProps {
    readonly children: React.ReactNode;
  }

  export class URLSanitizer {
    static isDangerous(url: string): boolean;
    static sanitize(url: string): string;
    static createSafe404Path(): string;
  }

  export default function Root(props: RootProps): JSX.Element;
}

// @theme/Heading is missing from the official type aliases, so we declare it here
declare module '@theme/Heading' {
  export interface Props extends React.HTMLAttributes<HTMLHeadingElement> {
    as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    id?: string;
    className?: string;
    children?: React.ReactNode;
  }

  const Heading: React.ComponentType<Props>;
  export default Heading;
}

// Extend @theme/Layout to include additional props used in the project
declare module '@theme/Layout' {
  export interface Props {
    readonly children?: React.ReactNode;
    readonly title?: string;
    readonly description?: string;
    readonly keywords?: string | string[];
    readonly image?: string;
    readonly wrapperClassName?: string;
    readonly pageClassName?: string;
    readonly searchMetadata?: {
      version?: string;
      tag?: string;
    };
  }

  export default function Layout(props: Props): React.ReactNode;
}
