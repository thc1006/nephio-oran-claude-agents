/**
 * K6 Performance Testing Script for Nephio O-RAN System
 * 
 * This script performs comprehensive performance testing including:
 * - Load testing with gradual ramp-up
 * - Stress testing to find breaking points
 * - Spike testing for sudden traffic increases
 * - Soak testing for memory leaks and degradation
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { randomItem, randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// Custom metrics
const errorRate = new Rate('error_rate');
const successRate = new Rate('success_rate');
const apiErrors = new Counter('api_errors');
const networkFunctionOps = new Counter('network_function_operations');
const metricsQueries = new Counter('metrics_queries');
const responseTime = new Trend('custom_response_time');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_TOKEN = __ENV.API_TOKEN || '';

// Test data
const NETWORK_FUNCTIONS = ['du-001', 'cu-cp-001', 'cu-up-001', 'ric-001'];
const NAMESPACES = ['oran-du', 'oran-cu', 'oran-ric', 'oran-core'];
const METRICS_TYPES = ['cpu', 'memory', 'network', 'latency', 'throughput'];

// Test scenarios configuration
export const options = {
  scenarios: {
    // Scenario 1: Load test with gradual ramp-up
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },   // Ramp up to 50 users
        { duration: '5m', target: 50 },   // Stay at 50 users
        { duration: '3m', target: 100 },  // Ramp up to 100 users
        { duration: '5m', target: 100 },  // Stay at 100 users
        { duration: '2m', target: 0 },    // Ramp down to 0 users
      ],
      gracefulRampDown: '30s',
      tags: { test_type: 'load' },
    },
    
    // Scenario 2: Stress test to find breaking point
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 200 },
        { duration: '5m', target: 200 },
        { duration: '2m', target: 300 },
        { duration: '5m', target: 300 },
        { duration: '2m', target: 400 },
        { duration: '5m', target: 400 },
        { duration: '10m', target: 0 },
      ],
      gracefulRampDown: '1m',
      tags: { test_type: 'stress' },
      startTime: '20m',  // Start after load test
    },
    
    // Scenario 3: Spike test for sudden traffic
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 10 },   // Baseline load
        { duration: '1m', target: 10 },    
        { duration: '10s', target: 500 },  // Spike to 500 users
        { duration: '3m', target: 500 },   // Stay at spike level
        { duration: '10s', target: 10 },   // Return to baseline
        { duration: '3m', target: 10 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '30s',
      tags: { test_type: 'spike' },
      startTime: '50m',  // Start after stress test
    },
    
    // Scenario 4: Soak test for long-term stability
    soak_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '30m',
      tags: { test_type: 'soak' },
      startTime: '60m',  // Start after spike test
    },
  },
  
  // Thresholds for pass/fail criteria
  thresholds: {
    // Response time thresholds
    http_req_duration: [
      'p(50)<200',   // 50% of requests should be below 200ms
      'p(90)<500',   // 90% of requests should be below 500ms
      'p(95)<1000',  // 95% of requests should be below 1000ms
      'p(99)<2000',  // 99% of requests should be below 2000ms
    ],
    
    // Error rate thresholds
    http_req_failed: ['rate<0.05'],  // Error rate should be below 5%
    error_rate: ['rate<0.1'],        // Custom error rate below 10%
    success_rate: ['rate>0.9'],      // Success rate above 90%
    
    // Throughput thresholds
    http_reqs: ['rate>100'],         // At least 100 requests per second
    
    // Custom metric thresholds
    custom_response_time: ['p(95)<1500'],
  },
  
  // Tags for better organization
  tags: {
    environment: __ENV.ENVIRONMENT || 'development',
    test_run: new Date().toISOString(),
  },
};

// Setup function - runs once before the test
export function setup() {
  console.log('Setting up performance test...');
  
  // Verify API is accessible
  const healthCheck = http.get(`${BASE_URL}/api/v1/health`);
  check(healthCheck, {
    'API is accessible': (r) => r.status === 200,
  });
  
  if (healthCheck.status !== 200) {
    throw new Error('API is not accessible, aborting test');
  }
  
  // Return data to be used in the test
  return {
    startTime: new Date().toISOString(),
    baseUrl: BASE_URL,
  };
}

// Default function - main test logic
export default function (data) {
  // Set up request headers
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': API_TOKEN ? `Bearer ${API_TOKEN}` : '',
    },
    timeout: '30s',
  };
  
  // Test different API endpoints based on weighted probability
  const scenario = Math.random();
  
  if (scenario < 0.2) {
    // 20% - Health checks
    healthCheckScenario(params);
  } else if (scenario < 0.5) {
    // 30% - Network function operations
    networkFunctionScenario(params);
  } else if (scenario < 0.75) {
    // 25% - Metrics queries
    metricsScenario(params);
  } else if (scenario < 0.9) {
    // 15% - Configuration management
    configurationScenario(params);
  } else {
    // 10% - Deployment operations
    deploymentScenario(params);
  }
  
  // Random think time between requests
  sleep(randomIntBetween(1, 3));
}

// Health check scenario
function healthCheckScenario(params) {
  group('Health Checks', () => {
    const startTime = new Date();
    const res = http.get(`${BASE_URL}/api/v1/health`, params);
    const duration = new Date() - startTime;
    
    responseTime.add(duration);
    
    const success = check(res, {
      'status is 200': (r) => r.status === 200,
      'response has status field': (r) => r.json('status') !== undefined,
      'response time < 200ms': (r) => r.timings.duration < 200,
    });
    
    errorRate.add(!success);
    successRate.add(success);
    
    if (!success) {
      apiErrors.add(1);
      console.error(`Health check failed: ${res.status}`);
    }
  });
}

// Network function operations scenario
function networkFunctionScenario(params) {
  group('Network Function Operations', () => {
    networkFunctionOps.add(1);
    
    // List network functions
    const listRes = http.get(`${BASE_URL}/api/v1/network-functions`, params);
    check(listRes, {
      'list status is 200': (r) => r.status === 200,
      'list returns array': (r) => Array.isArray(r.json()),
    });
    
    if (listRes.status === 200 && listRes.json().length > 0) {
      const nfId = listRes.json()[0].id || randomItem(NETWORK_FUNCTIONS);
      
      // Get specific network function
      const getRes = http.get(`${BASE_URL}/api/v1/network-functions/${nfId}`, params);
      check(getRes, {
        'get status is 200': (r) => r.status === 200,
        'get returns object': (r) => typeof r.json() === 'object',
      });
      
      // Update network function
      const updatePayload = JSON.stringify({
        config: {
          replicas: randomIntBetween(2, 5),
          resources: {
            cpu: `${randomIntBetween(2, 8)}`,
            memory: `${randomIntBetween(4, 16)}Gi`,
          },
        },
      });
      
      const updateRes = http.patch(
        `${BASE_URL}/api/v1/network-functions/${nfId}`,
        updatePayload,
        params
      );
      
      const success = check(updateRes, {
        'update status is 200': (r) => r.status === 200,
      });
      
      errorRate.add(!success);
      successRate.add(success);
    }
  });
}

// Metrics scenario
function metricsScenario(params) {
  group('Metrics Collection', () => {
    metricsQueries.add(1);
    
    const nf = randomItem(NETWORK_FUNCTIONS);
    const metricType = randomItem(METRICS_TYPES);
    
    // Get metrics for specific network function
    const metricsRes = http.get(
      `${BASE_URL}/api/v1/metrics/network-functions/${nf}?type=${metricType}&duration=1h`,
      params
    );
    
    check(metricsRes, {
      'metrics status is 200': (r) => r.status === 200,
      'metrics has data': (r) => r.json('data') !== undefined,
    });
    
    // Get aggregated metrics
    const namespace = randomItem(NAMESPACES);
    const aggregateRes = http.get(
      `${BASE_URL}/api/v1/metrics/aggregate?namespace=${namespace}`,
      params
    );
    
    const success = check(aggregateRes, {
      'aggregate status is 200': (r) => r.status === 200,
    });
    
    errorRate.add(!success);
    successRate.add(success);
  });
}

// Configuration management scenario
function configurationScenario(params) {
  group('Configuration Management', () => {
    // Get configuration templates
    const templatesRes = http.get(`${BASE_URL}/api/v1/configurations/templates`, params);
    
    check(templatesRes, {
      'templates status is 200': (r) => r.status === 200,
      'templates returns array': (r) => Array.isArray(r.json()),
    });
    
    if (templatesRes.status === 200 && templatesRes.json().length > 0) {
      const templateId = templatesRes.json()[0].id;
      
      // Apply configuration
      const applyPayload = JSON.stringify({
        templateId: templateId,
        namespace: randomItem(NAMESPACES),
        parameters: {
          scaling: 'auto',
          monitoring: 'enabled',
          logLevel: 'info',
        },
      });
      
      const applyRes = http.post(
        `${BASE_URL}/api/v1/configurations/apply`,
        applyPayload,
        params
      );
      
      const success = check(applyRes, {
        'apply status is 202': (r) => r.status === 202,
        'apply returns jobId': (r) => r.json('jobId') !== undefined,
      });
      
      errorRate.add(!success);
      successRate.add(success);
      
      if (success && applyRes.json('jobId')) {
        sleep(1);
        
        // Check job status
        const jobId = applyRes.json('jobId');
        const jobRes = http.get(`${BASE_URL}/api/v1/jobs/${jobId}`, params);
        
        check(jobRes, {
          'job status is 200': (r) => r.status === 200,
          'job has status field': (r) => r.json('status') !== undefined,
        });
      }
    }
  });
}

// Deployment operations scenario
function deploymentScenario(params) {
  group('Deployment Management', () => {
    const namespace = randomItem(NAMESPACES);
    
    // List deployments
    const listRes = http.get(
      `${BASE_URL}/api/v1/deployments?namespace=${namespace}`,
      params
    );
    
    check(listRes, {
      'deployments status is 200': (r) => r.status === 200,
      'deployments returns array': (r) => Array.isArray(r.json()),
    });
    
    if (listRes.status === 200 && listRes.json().length > 0) {
      const deploymentId = listRes.json()[0].id;
      
      // Scale deployment
      const scalePayload = JSON.stringify({
        replicas: randomIntBetween(2, 5),
      });
      
      const scaleRes = http.post(
        `${BASE_URL}/api/v1/deployments/${deploymentId}/scale`,
        scalePayload,
        params
      );
      
      check(scaleRes, {
        'scale status is 200': (r) => r.status === 200,
      });
      
      sleep(1);
      
      // Get deployment status
      const statusRes = http.get(
        `${BASE_URL}/api/v1/deployments/${deploymentId}/status`,
        params
      );
      
      const success = check(statusRes, {
        'status is 200': (r) => r.status === 200,
        'has replicas field': (r) => r.json('replicas') !== undefined,
        'has readyReplicas field': (r) => r.json('readyReplicas') !== undefined,
      });
      
      errorRate.add(!success);
      successRate.add(success);
    }
  });
}

// Teardown function - runs once after the test
export function teardown(data) {
  console.log('Performance test completed');
  console.log(`Test started at: ${data.startTime}`);
  console.log(`Test ended at: ${new Date().toISOString()}`);
}