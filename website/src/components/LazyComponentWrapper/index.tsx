import { lazy, Suspense, ComponentType, ReactElement } from 'react';

interface LazyComponentWrapperProps {
  fallback?: ReactElement;
  children: ReactElement;
}

/**
 * Higher-order component for lazy loading components with error boundaries
 */
export function withLazyLoading<T extends Record<string, any>>(
  componentImporter: () => Promise<{ default: ComponentType<T> }>,
  fallback?: ReactElement
): ComponentType<T> {
  const LazyComponent = lazy(componentImporter);
  
  return function WrappedLazyComponent(props: T) {
    return (
      <Suspense fallback={fallback || <div>Loading...</div>}>
        <LazyComponent {...(props as any)} />
      </Suspense>
    );
  };
}

/**
 * Generic lazy component wrapper with Suspense boundary
 */
export default function LazyComponentWrapper({
  fallback = <div className="loading-spinner" role="status" aria-label="Loading content">Loading...</div>,
  children,
}: LazyComponentWrapperProps): ReactElement {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

/**
 * Loading spinner component for better UX
 */
export const LoadingSpinner = ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => (
  <div 
    className={`loading-spinner loading-spinner--${size}`}
    role="status"
    aria-label="Loading content"
  >
    <div className="spinner"></div>
  </div>
);