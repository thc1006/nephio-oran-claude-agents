// Docusaurus theme components type declarations
import * as React from 'react';

// Re-export React types for convenience
export { React };

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
  export interface HeadingProps {
    as: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    id?: string;
    className?: string;
    children?: React.ReactNode;
  }

  const Heading: React.ComponentType<HeadingProps>;
  export default Heading;
}

declare module '@theme/DocSidebar' {
  export interface DocSidebarProps {
    sidebar: any[];
    path: string;
    onCollapse: () => void;
    isHidden: boolean;
  }

  const DocSidebar: React.ComponentType<DocSidebarProps>;
  export default DocSidebar;
}

declare module '@theme/NavbarItem' {
  export interface NavbarItemProps {
    mobile?: boolean;
    position?: 'left' | 'right';
    [key: string]: any;
  }

  const NavbarItem: React.ComponentType<NavbarItemProps>;
  export default NavbarItem;
}

declare module '@theme/Footer' {
  const Footer: React.ComponentType;
  export default Footer;
}

declare module '@theme/Navbar' {
  const Navbar: React.ComponentType;
  export default Navbar;
}

declare module '@theme/SearchBar' {
  const SearchBar: React.ComponentType;
  export default SearchBar;
}

declare module '@theme/TOC' {
  export interface TOCProps {
    toc: any[];
    editUrl?: string;
    [key: string]: any;
  }

  const TOC: React.ComponentType<TOCProps>;
  export default TOC;
}