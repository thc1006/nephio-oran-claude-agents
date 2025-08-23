// Type declaration for @theme/Heading
declare module '@theme/Heading' {
  import * as React from 'react';

  export interface Props extends React.HTMLAttributes<HTMLHeadingElement> {
    as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    id?: string;
    className?: string;
    children?: React.ReactNode;
  }

  const Heading: React.ComponentType<Props>;
  export default Heading;
}