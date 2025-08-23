// Global type declarations for Docusaurus modules
/// <reference path="./node_modules/@docusaurus/module-type-aliases/src/index.d.ts" />
import * as React from 'react';

// @theme/Heading is missing from the official type aliases
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