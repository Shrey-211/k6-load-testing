import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const apiCalls = new Counter('api_calls_total');

export const options = {
  stages: [
    { duration: '30s', target: 5 },
    { duration: '1m', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '1m', target: 10 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],
    'http_req_failed': ['rate<0.01'],
    'errors': ['rate<0.1'],
  },
  tags: {
    testType: 'load-test',
    environment: 'staging',
  },
};

export function setup() {
  console.log('🚀 Starting load test...');
  return {
    baseUrl: 'https://httpbin.org',
    timestamp: new Date().toISOString(),
  };
}

export default function (data) {
  const baseUrl = data.baseUrl;

  // 1. GET endpoint
  const res1 = http.get(`${baseUrl}/get`, {
    tags: { name: 'get-endpoint' },
  });

  const ok1 = check(res1, {
    'GET 200': (r) => r.status === 200,
    'GET < 300ms': (r) => r.timings.duration < 300,
    'Content-Type is JSON': (r) => r.headers['Content-Type'].includes('application/json'),
  });

  apiCalls.add(1);
  errorRate.add(!ok1);

  // 2. POST endpoint
  const payload = JSON.stringify({
    name: `user-${__VU}-${__ITER}`,
    email: `user${__VU}@example.com`,
    timestamp: new Date().toISOString(),
  });

  const res2 = http.post(`${baseUrl}/post`, payload, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-load-test/1.0',
    },
    tags: { name: 'post-endpoint' },
  });

  const ok2 = check(res2, {
    'POST 200': (r) => r.status === 200,
    'POST < 500ms': (r) => r.timings.duration < 500,
    'POST echoed correctly': (r) => {
      try {
        const body = JSON.parse(r.body);
        const sent = JSON.parse(body.data);
        return sent.name === `user-${__VU}-${__ITER}`;
      } catch {
        return false;
      }
    },
  });

  apiCalls.add(1);
  errorRate.add(!ok2);

  sleep(1); // simulate think time

  // 3. Batch request
  const batchRequests = {
    'status': {
      method: 'GET',
      url: `${baseUrl}/status/200`,
      params: { tags: { name: 'status-check' } },
    },
    'headers': {
      method: 'GET',
      url: `${baseUrl}/headers`,
      params: { tags: { name: 'headers-check' } },
    },
    'delay': {
      method: 'GET',
      url: `${baseUrl}/delay/1`,
      params: { tags: { name: 'delay-test' } },
    },
  };

  const batchRes = http.batch(batchRequests);

  const batchOK = check(batchRes, {
    'Status OK': (r) => r.status.status === 200,
    'Headers OK': (r) => r.headers.status === 200,
    'Delay OK': (r) => r.delay.status === 200,
  });

  apiCalls.add(3);

  if (__VU === 1 && __ITER === 1) {
    console.log(`📊 Debug Info:`);
    console.log(`- GET: ${res1.timings.duration}ms`);
    console.log(`- POST: ${res2.timings.duration}ms`);
    console.log(`- Batch count: ${Object.keys(batchRes).length}`);
  }

  sleep(Math.random() * 2 + 1); // random delay between 1-3 sec
}

export function teardown(data) {
  console.log('🏁 Load test completed');
  console.log(`- Started at: ${data.timestamp}`);
  console.log(`- Ended at: ${new Date().toISOString()}`);
}

export function handleSummary(data) {
  console.log('\n📈 CUSTOM SUMMARY');
  console.log('==================');
  console.log(`Requests: ${data.metrics.http_reqs.values.count}`);
  console.log(`Failures: ${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%`);
  console.log(`Avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms`);
  console.log(`P95: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms`);
  console.log(`Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms`);
  console.log(`Throughput: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s`);
  console.log(`Data received: ${(data.metrics.data_received.values.count / 1024 / 1024).toFixed(2)} MB`);

  return {
    stdout: JSON.stringify(data, null, 2),
  };
}
