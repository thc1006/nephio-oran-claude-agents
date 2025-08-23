const React = require('react');

const Link = React.forwardRef(({ to, children, ...props }, ref) => 
  React.createElement('a', { 
    ref,
    href: to, 
    'data-testid': 'home-link',
    ...props 
  }, children));

Link.displayName = 'Link';

module.exports = Link;
module.exports.default = Link;