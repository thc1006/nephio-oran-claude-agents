// Mock for CSS modules that always returns valid class names to avoid clsx undefined issues
module.exports = new Proxy({}, {
  get(target, prop) {
    // Always return the property name as the class name
    // This prevents clsx from receiving undefined values
    return typeof prop === 'string' ? prop : 'mock-class';
  }
});