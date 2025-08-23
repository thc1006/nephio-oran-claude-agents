/**
 * Mock strategies and utilities for comprehensive testing
 * Provides various mocking approaches for different testing scenarios
 */

import { jest } from '@jest/globals';
import { TestDataFactory } from '../factories/test-data-factory';

/**
 * Mock strategy interface for consistent mocking approaches
 */
export interface MockStrategy {
  setup(): void;
  teardown(): void;
  name: string;
}

/**
 * API Mock Strategy
 * Mocks external API calls and responses
 */
export class ApiMockStrategy implements MockStrategy {
  name = 'ApiMockStrategy';
  private originalFetch: typeof global.fetch;

  constructor() {
    this.originalFetch = global.fetch;
  }

  setup(): void {
    global.fetch = jest.fn<typeof fetch>().mockImplementation(async (url, options = {}) => {
      const urlString = url.toString();
      const method = options.method || 'GET';

      // Mock different API endpoints
      if (urlString.includes('/api/agents')) {
        return this.mockAgentsApi(urlString, method, options);
      }

      if (urlString.includes('/api/compatibility')) {
        return this.mockCompatibilityApi(urlString, method);
      }

      if (urlString.includes('/api/search')) {
        return this.mockSearchApi(urlString, method, options);
      }

      if (urlString.includes('/api/health')) {
        return this.mockHealthApi();
      }

      // Default mock response
      return this.mockDefaultResponse();
    });
  }

  teardown(): void {
    global.fetch = this.originalFetch;
  }

  private async mockAgentsApi(url: string, method: string, options: any): Promise<Response> {
    if (method === 'GET') {
      // Get all agents
      if (url.endsWith('/api/agents')) {
        const agents = [
          TestDataFactory.createAgent({ id: 'config-agent' }),
          TestDataFactory.createAgent({ id: 'infra-agent' }),
          TestDataFactory.createAgent({ id: 'monitor-agent' })
        ];

        return new Response(JSON.stringify({
          success: true,
          data: agents,
          total: agents.length
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Get specific agent
      const agentIdMatch = url.match(/\/api\/agents\/([^/]+)$/);
      if (agentIdMatch) {
        const agentId = agentIdMatch[1];
        const agent = TestDataFactory.createAgent({ id: agentId });

        return new Response(JSON.stringify({
          success: true,
          data: agent
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    if (method === 'POST' && options.body) {
      // Create new agent
      const requestBody = JSON.parse(options.body);
      const newAgent = TestDataFactory.createAgent(requestBody);

      return new Response(JSON.stringify({
        success: true,
        data: newAgent,
        message: 'Agent created successfully'
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Not found
    return new Response(JSON.stringify({
      success: false,
      error: 'Agent not found'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async mockCompatibilityApi(url: string, method: string): Promise<Response> {
    const compatibilityData = {
      lastUpdated: '2025-01-15',
      compatibilityMatrix: TestDataFactory.createCompatibilityEntries(10),
      categories: {
        core: ['Go Runtime', 'O-RAN L-Release', 'Nephio'],
        kubernetes: ['Kubernetes'],
        observability: ['Prometheus', 'Grafana']
      }
    };

    return new Response(JSON.stringify({
      success: true,
      data: compatibilityData
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async mockSearchApi(url: string, method: string, options: any): Promise<Response> {
    const urlParams = new URL(url).searchParams;
    const query = urlParams.get('q') || '';
    const limit = parseInt(urlParams.get('limit') || '10');

    // Simulate search results
    const results = Array.from({ length: Math.min(5, limit) }, (_, i) => ({
      id: `result-${i}`,
      title: `Search result ${i + 1} for "${query}"`,
      content: `This is a mock search result containing ${query}`,
      url: `/docs/result-${i}`,
      type: 'documentation',
      relevance: Math.random()
    }));

    return new Response(JSON.stringify({
      success: true,
      data: {
        results,
        total: results.length,
        query,
        time: Math.random() * 100 // Search time in ms
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async mockHealthApi(): Promise<Response> {
    return new Response(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'up',
        cache: 'up',
        search: 'up'
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async mockDefaultResponse(): Promise<Response> {
    return new Response(JSON.stringify({
      success: false,
      error: 'Not found'
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Local Storage Mock Strategy
 * Mocks browser local storage for testing persistence
 */
export class LocalStorageMockStrategy implements MockStrategy {
  name = 'LocalStorageMockStrategy';
  private storage: Map<string, string> = new Map();

  setup(): void {
    const mockStorage = {
      getItem: jest.fn((key: string) => this.storage.get(key) || null),
      setItem: jest.fn((key: string, value: string) => {
        this.storage.set(key, value);
      }),
      removeItem: jest.fn((key: string) => {
        this.storage.delete(key);
      }),
      clear: jest.fn(() => {
        this.storage.clear();
      }),
      length: 0,
      key: jest.fn((index: number) => {
        const keys = Array.from(this.storage.keys());
        return keys[index] || null;
      })
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true
    });

    // Pre-populate with test data
    this.storage.set('user-preferences', JSON.stringify({
      theme: 'light',
      language: 'en',
      viewMode: 'detailed'
    }));

    this.storage.set('recent-agents', JSON.stringify([
      'configuration-management-agent',
      'nephio-infrastructure-agent'
    ]));
  }

  teardown(): void {
    this.storage.clear();
  }
}

/**
 * Session Storage Mock Strategy
 * Mocks browser session storage for testing session persistence
 */
export class SessionStorageMockStrategy implements MockStrategy {
  name = 'SessionStorageMockStrategy';
  private storage: Map<string, string> = new Map();

  setup(): void {
    const mockStorage = {
      getItem: jest.fn((key: string) => this.storage.get(key) || null),
      setItem: jest.fn((key: string, value: string) => {
        this.storage.set(key, value);
      }),
      removeItem: jest.fn((key: string) => {
        this.storage.delete(key);
      }),
      clear: jest.fn(() => {
        this.storage.clear();
      }),
      length: 0,
      key: jest.fn((index: number) => {
        const keys = Array.from(this.storage.keys());
        return keys[index] || null;
      })
    };

    Object.defineProperty(window, 'sessionStorage', {
      value: mockStorage,
      writable: true
    });

    // Pre-populate with session data
    this.storage.set('current-session', JSON.stringify({
      sessionId: 'test-session-123',
      startTime: new Date().toISOString(),
      currentAgent: 'configuration-management-agent'
    }));
  }

  teardown(): void {
    this.storage.clear();
  }
}

/**
 * Location Mock Strategy  
 * Mocks browser location and navigation for testing routing
 */
export class LocationMockStrategy implements MockStrategy {
  name = 'LocationMockStrategy';
  private originalLocation: Location;

  constructor() {
    this.originalLocation = window.location;
  }

  setup(): void {
    const mockLocation = {
      href: 'http://localhost:3000/',
      origin: 'http://localhost:3000',
      protocol: 'http:',
      hostname: 'localhost',
      port: '3000',
      pathname: '/',
      search: '',
      hash: '',
      assign: jest.fn(),
      replace: jest.fn(),
      reload: jest.fn(),
      toString: jest.fn(() => 'http://localhost:3000/')
    };

    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true
    });
  }

  teardown(): void {
    Object.defineProperty(window, 'location', {
      value: this.originalLocation,
      writable: true
    });
  }

  updateLocation(pathname: string, search = '', hash = ''): void {
    const location = window.location as any;
    location.pathname = pathname;
    location.search = search;
    location.hash = hash;
    location.href = `${location.origin}${pathname}${search}${hash}`;
  }
}

/**
 * IntersectionObserver Mock Strategy
 * Mocks IntersectionObserver for testing scroll-based interactions
 */
export class IntersectionObserverMockStrategy implements MockStrategy {
  name = 'IntersectionObserverMockStrategy';
  private observers: Map<Element, IntersectionObserverCallback> = new Map();

  setup(): void {
    const mockIntersectionObserver = jest.fn((callback: IntersectionObserverCallback, options?: IntersectionObserverInit) => {
      const instance = {
        observe: jest.fn((element: Element) => {
          this.observers.set(element, callback);
          
          // Simulate immediate intersection
          setTimeout(() => {
            callback([{
              target: element,
              isIntersecting: true,
              intersectionRatio: 1,
              boundingClientRect: {
                x: 0, y: 0, width: 100, height: 100,
                top: 0, right: 100, bottom: 100, left: 0,
                toJSON: () => ({})
              } as DOMRectReadOnly,
              intersectionRect: {
                x: 0, y: 0, width: 100, height: 100,
                top: 0, right: 100, bottom: 100, left: 0,
                toJSON: () => ({})
              } as DOMRectReadOnly,
              rootBounds: null,
              time: Date.now()
            }], instance as IntersectionObserver);
          }, 100);
        }),
        unobserve: jest.fn((element: Element) => {
          this.observers.delete(element);
        }),
        disconnect: jest.fn(() => {
          this.observers.clear();
        })
      };
      
      return instance;
    });

    (global as any).IntersectionObserver = mockIntersectionObserver;
  }

  teardown(): void {
    this.observers.clear();
  }

  triggerIntersection(element: Element, isIntersecting: boolean): void {
    const callback = this.observers.get(element);
    if (callback) {
      callback([{
        target: element,
        isIntersecting,
        intersectionRatio: isIntersecting ? 1 : 0,
        boundingClientRect: {
          x: 0, y: 0, width: 100, height: 100,
          top: 0, right: 100, bottom: 100, left: 0,
          toJSON: () => ({})
        } as DOMRectReadOnly,
        intersectionRect: {
          x: 0, y: 0, width: 100, height: 100,
          top: 0, right: 100, bottom: 100, left: 0,
          toJSON: () => ({})
        } as DOMRectReadOnly,
        rootBounds: null,
        time: Date.now()
      }], {} as IntersectionObserver);
    }
  }
}

/**
 * ResizeObserver Mock Strategy
 * Mocks ResizeObserver for testing responsive behavior
 */
export class ResizeObserverMockStrategy implements MockStrategy {
  name = 'ResizeObserverMockStrategy';
  private observers: Map<Element, ResizeObserverCallback> = new Map();

  setup(): void {
    const mockResizeObserver = jest.fn((callback: ResizeObserverCallback) => {
      const instance = {
        observe: jest.fn((element: Element) => {
          this.observers.set(element, callback);
          
          // Simulate initial resize
          setTimeout(() => {
            callback([{
              target: element,
              contentRect: {
                x: 0, y: 0, width: 800, height: 600,
                top: 0, right: 800, bottom: 600, left: 0,
                toJSON: () => ({})
              } as DOMRectReadOnly,
              borderBoxSize: [{
                blockSize: 600,
                inlineSize: 800
              }],
              contentBoxSize: [{
                blockSize: 600,
                inlineSize: 800
              }],
              devicePixelContentBoxSize: [{
                blockSize: 600,
                inlineSize: 800
              }]
            }], instance as ResizeObserver);
          }, 100);
        }),
        unobserve: jest.fn((element: Element) => {
          this.observers.delete(element);
        }),
        disconnect: jest.fn(() => {
          this.observers.clear();
        })
      };
      
      return instance;
    });

    (global as any).ResizeObserver = mockResizeObserver;
  }

  teardown(): void {
    this.observers.clear();
  }

  triggerResize(element: Element, width: number, height: number): void {
    const callback = this.observers.get(element);
    if (callback) {
      callback([{
        target: element,
        contentRect: {
          x: 0, y: 0, width, height,
          top: 0, right: width, bottom: height, left: 0,
          toJSON: () => ({})
        } as DOMRectReadOnly,
        borderBoxSize: [{
          blockSize: height,
          inlineSize: width
        }],
        contentBoxSize: [{
          blockSize: height,
          inlineSize: width
        }],
        devicePixelContentBoxSize: [{
          blockSize: height,
          inlineSize: width
        }]
      }], {} as ResizeObserver);
    }
  }
}

/**
 * Console Mock Strategy
 * Mocks console methods for testing logging and debugging output
 */
export class ConsoleMockStrategy implements MockStrategy {
  name = 'ConsoleMockStrategy';
  private originalConsole: Console;
  private logs: Array<{ level: string; args: any[] }> = [];

  constructor() {
    this.originalConsole = console;
  }

  setup(): void {
    const mockConsole = {
      log: jest.fn((...args) => this.logs.push({ level: 'log', args })),
      info: jest.fn((...args) => this.logs.push({ level: 'info', args })),
      warn: jest.fn((...args) => this.logs.push({ level: 'warn', args })),
      error: jest.fn((...args) => this.logs.push({ level: 'error', args })),
      debug: jest.fn((...args) => this.logs.push({ level: 'debug', args })),
      trace: jest.fn((...args) => this.logs.push({ level: 'trace', args })),
      assert: jest.fn(),
      clear: jest.fn(() => { this.logs = []; }),
      count: jest.fn(),
      countReset: jest.fn(),
      dir: jest.fn(),
      dirxml: jest.fn(),
      group: jest.fn(),
      groupCollapsed: jest.fn(),
      groupEnd: jest.fn(),
      table: jest.fn(),
      time: jest.fn(),
      timeEnd: jest.fn(),
      timeLog: jest.fn(),
      timeStamp: jest.fn(),
      profile: jest.fn(),
      profileEnd: jest.fn()
    };

    global.console = mockConsole as Console;
  }

  teardown(): void {
    global.console = this.originalConsole;
    this.logs = [];
  }

  getLogs(): Array<{ level: string; args: any[] }> {
    return [...this.logs];
  }

  getLogsByLevel(level: string): Array<{ level: string; args: any[] }> {
    return this.logs.filter(log => log.level === level);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

/**
 * Mock Manager
 * Coordinates multiple mock strategies
 */
export class MockManager {
  private strategies: MockStrategy[] = [];

  addStrategy(strategy: MockStrategy): void {
    this.strategies.push(strategy);
  }

  setupAll(): void {
    this.strategies.forEach(strategy => {
      try {
        strategy.setup();
      } catch (error) {
        console.error(`Failed to setup mock strategy ${strategy.name}:`, error);
      }
    });
  }

  teardownAll(): void {
    this.strategies.forEach(strategy => {
      try {
        strategy.teardown();
      } catch (error) {
        console.error(`Failed to teardown mock strategy ${strategy.name}:`, error);
      }
    });
  }

  getStrategy<T extends MockStrategy>(name: string): T | undefined {
    return this.strategies.find(strategy => strategy.name === name) as T;
  }
}

/**
 * Predefined mock configurations for common testing scenarios
 */
export const MockConfigurations = {
  // Basic mocking for unit tests
  unit: () => {
    const manager = new MockManager();
    manager.addStrategy(new LocalStorageMockStrategy());
    manager.addStrategy(new SessionStorageMockStrategy());
    manager.addStrategy(new ConsoleMockStrategy());
    return manager;
  },

  // Integration testing with API mocks
  integration: () => {
    const manager = new MockManager();
    manager.addStrategy(new ApiMockStrategy());
    manager.addStrategy(new LocalStorageMockStrategy());
    manager.addStrategy(new SessionStorageMockStrategy());
    manager.addStrategy(new LocationMockStrategy());
    manager.addStrategy(new ConsoleMockStrategy());
    return manager;
  },

  // Full mocking for comprehensive testing
  comprehensive: () => {
    const manager = new MockManager();
    manager.addStrategy(new ApiMockStrategy());
    manager.addStrategy(new LocalStorageMockStrategy());
    manager.addStrategy(new SessionStorageMockStrategy());
    manager.addStrategy(new LocationMockStrategy());
    manager.addStrategy(new IntersectionObserverMockStrategy());
    manager.addStrategy(new ResizeObserverMockStrategy());
    manager.addStrategy(new ConsoleMockStrategy());
    return manager;
  }
};

export default {
  MockManager,
  MockConfigurations,
  ApiMockStrategy,
  LocalStorageMockStrategy,
  SessionStorageMockStrategy,
  LocationMockStrategy,
  IntersectionObserverMockStrategy,
  ResizeObserverMockStrategy,
  ConsoleMockStrategy
};