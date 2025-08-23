const React = require('react');

const Layout = React.forwardRef(({ title, description, children, ...props }, ref) => 
  React.createElement('div', { 
    ref,
    'data-testid': 'layout',
    'data-title': title,
    'data-description': description,
    ...props 
  }, children));

Layout.displayName = 'Layout';

module.exports = Layout;
module.exports.default = Layout;