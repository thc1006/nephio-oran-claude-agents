// Mock for CSS modules that returns the property name as class name
// This prevents clsx from receiving undefined values while maintaining correct behavior
module.exports = new Proxy({}, {
  get(target, prop) {
    // Handle special cases
    if (prop === '__esModule') return true;
    if (prop === 'default') return this;
    if (typeof prop === 'symbol') return prop.toString();
    
    // Always return the property name as the class name
    // This prevents clsx from receiving undefined values
    return typeof prop === 'string' ? prop : 'mock-class';
  }
});