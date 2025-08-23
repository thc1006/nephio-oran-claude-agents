/// <reference types="jest" />

// Explicitly declare Jest globals with proper types that include .skip
declare global {
  var describe: {
    (name: string, fn: () => void): void;
    skip: (name: string, fn: () => void) => void;
    only: (name: string, fn: () => void) => void;
  };
  
  var it: {
    (name: string, fn: () => void | Promise<void>): void;
    skip: (name: string, fn: () => void | Promise<void>) => void;
    only: (name: string, fn: () => void | Promise<void>) => void;
  };
  
  var test: {
    (name: string, fn: () => void | Promise<void>): void;
    skip: (name: string, fn: () => void | Promise<void>) => void;
    only: (name: string, fn: () => void | Promise<void>) => void;
  };
  
  var expect: jest.Expect;
  var beforeAll: jest.Lifecycle;
  var afterAll: jest.Lifecycle;
  var beforeEach: jest.Lifecycle;
  var afterEach: jest.Lifecycle;
  var jest: jest.Jest;
}

export {};