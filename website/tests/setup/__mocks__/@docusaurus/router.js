const React = require('react');

module.exports = {
  useLocation: () => ({
    pathname: '/test-path',
    search: '',
    hash: '',
  }),
  useHistory: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    go: jest.fn(),
    goBack: jest.fn(),
    goForward: jest.fn(),
  }),
};

// For ES modules compatibility
module.exports.default = module.exports;