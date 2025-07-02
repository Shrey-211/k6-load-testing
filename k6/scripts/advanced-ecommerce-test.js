// advanced-ecommerce-test.js
import http from 'k6/http';
import { check, sleep, fail } from 'k6';
import { Counter, Rate, Trend, Gauge } from 'k6/metrics';
import { randomIntBetween, randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js';

// Custom Metrics
const loginErrors = new Counter('login_errors');
const cartOperations = new Counter('cart_operations');
const checkoutSuccess = new Rate('checkout_success_rate');
const productViewTime = new Trend('product_view_duration');
const activeUsers = new Gauge('active_users_gauge');

// Test Configuration
export const options = {
  scenarios: {
    // Normal user browsing
    browsing_users: {
      executor: 'constant-vus',
      vus: 20,
      duration: '5m',
      tags: { scenario: 'browsing' },
    },
    
    // Shopping users (more intensive)
    shopping_users: {
      executor: 'ramping-vus',
      startTime: '1m',
      stages: [
        { duration: '2m', target: 10 },
        { duration: '2m', target: 15 },
        { duration: '1m', target: 0 },
      ],
      tags: { scenario: 'shopping' },
    },
    
    // Peak load simulation
    flash_sale: {
      executor: 'constant-arrival-rate',
      rate: 50, // 50 iterations per second
      timeUnit: '1s',
      duration: '2m',
      preAllocatedVUs: 30,
      maxVUs: 100,
      startTime: '3m',
      tags: { scenario: 'flash_sale' },
    },
  },
  
  thresholds: {
    // Global thresholds
    'http_req_duration': [
      'p(90)<500',
      'p(95)<800',
      'p(99)<2000'
    ],
    'http_req_failed': ['rate<0.05'],
    
    // Scenario-specific thresholds
    'http_req_duration{scenario:browsing}': ['p(95)<400'],
    'http_req_duration{scenario:shopping}': ['p(95)<600'],
    'http_req_duration{scenario:flash_sale}': ['p(95)<1000'],
    
    // Custom metric thresholds
    'login_errors': ['count<10'],
    'checkout_success_rate': ['rate>0.95'],
    'product_view_duration': ['p(90)<200'],
  },
  
  // Global tags
  tags: {
    testType: 'e-commerce-load-test',
    environment: __ENV.ENVIRONMENT || 'staging',
    version: '1.0.0',
  },
};

// Test Data
const products = [
  { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics' },
  { id: 2, name: 'Smartphone', price: 699.99, category: 'Electronics' },
  { id: 3, name: 'Headphones', price: 199.99, category: 'Audio' },
  { id: 4, name: 'Book', price: 29.99, category: 'Books' },
  { id: 5, name: 'T-Shirt', price: 19.99, category: 'Clothing' },
];

const userCredentials = [
  { username: 'user1@example.com', password: 'password123' },
  { username: 'user2@example.com', password: 'password123' },
  { username: 'user3@example.com', password: 'password123' },
];

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://host.docker.internal:5000';
const API_KEY = __ENV.API_KEY || 'test-api-key';

// Setup function
export function setup() {
  console.log('🛒 Starting E-commerce Load Test');
  console.log(`   Environment: ${__ENV.ENVIRONMENT || 'staging'}`);
  console.log(`   Base URL: ${BASE_URL}`);
  
  // Warm up the application
  const warmupResponse = http.get(`${BASE_URL}/get`);
  if (warmupResponse.status !== 200) {
    fail('Warmup request failed - aborting test');
  }
  
  return {
    baseUrl: BASE_URL,
    apiKey: API_KEY,
    startTime: Date.now(),
  };
}

// Main test function
export default function(data) {
  const scenario = __ENV.K6_SCENARIO || 'browsing';
  activeUsers.add(1);
  
  // Determine user behavior based on scenario
  switch(scenario) {
    case 'browsing':
      browsingUserFlow(data);
      break;
    case 'shopping':
      shoppingUserFlow(data);
      break;
    case 'flash_sale':
      flashSaleFlow(data);
      break;
    default:
      // Random behavior
      const flows = [browsingUserFlow, shoppingUserFlow];
      randomItem(flows)(data);
  }
  
  activeUsers.add(-1);
}

// User Flow: Browsing User
function browsingUserFlow(data) {
  // 1. Visit homepage
  const homepage = http.get(`${data.baseUrl}/get`, {
    headers: getHeaders(data.apiKey),
    tags: { name: 'homepage', flow: 'browsing' },
  });
  
  check(homepage, {
    'Homepage loaded': (r) => r.status === 200,
    'Homepage response time OK': (r) => r.timings.duration < 300,
  });
  
  sleep(randomIntBetween(1, 3));
  
  // 2. Browse products
  for (let i = 0; i < randomIntBetween(2, 5); i++) {
    const product = randomItem(products);
    const startTime = Date.now();
    
    const productResponse = http.get(`${data.baseUrl}/get?product_id=${product.id}`, {
      headers: getHeaders(data.apiKey),
      tags: { name: 'product-view', flow: 'browsing', product_category: product.category },
    });
    
    const viewDuration = Date.now() - startTime;
    productViewTime.add(viewDuration);
    
    check(productResponse, {
      'Product page loaded': (r) => r.status === 200,
      'Product data present': (r) => r.body.includes('product_id'),
    });
    
    sleep(randomIntBetween(2, 8)); // Browsing time
  }
  
  // 3. Search functionality
  const searchQuery = randomItem(['laptop', 'phone', 'book', 'shirt']);
  const searchResponse = http.get(`${data.baseUrl}/get?search=${searchQuery}`, {
    headers: getHeaders(data.apiKey),
    tags: { name: 'search', flow: 'browsing' },
  });
  
  check(searchResponse, { 'Search works': (r) => r.status === 200 });
  
  sleep(randomIntBetween(1, 2));
}

// User Flow: Shopping User
function shoppingUserFlow(data) {
  let sessionToken = null;
  
  // 1. Login
  const credentials = randomItem(userCredentials);
  const loginResponse = http.post(`${data.baseUrl}/post`, JSON.stringify({
    username: credentials.username,
    password: credentials.password,
  }), {
    headers: {
      ...getHeaders(data.apiKey),
      'Content-Type': 'application/json',
    },
    tags: { name: 'login', flow: 'shopping' },
  });
  
  const loginSuccess = check(loginResponse, {
    'Login successful': (r) => r.status === 200,
    'Login response time OK': (r) => r.timings.duration < 500,
  });
  
  if (!loginSuccess) {
    loginErrors.add(1);
    return; // Exit if login fails
  }
  
  // Extract session token (simulated)
  sessionToken = `session-${__VU}-${__ITER}`;
  
  sleep(1);
  
  // 2. Add items to cart
  const itemsToAdd = randomIntBetween(1, 4);
  for (let i = 0; i < itemsToAdd; i++) {
    const product = randomItem(products);
    const quantity = randomIntBetween(1, 3);
    
    const addToCartResponse = http.post(`${data.baseUrl}/post`, JSON.stringify({
      action: 'add_to_cart',
      product_id: product.id,
      quantity: quantity,
      session_token: sessionToken,
    }), {
      headers: {
        ...getHeaders(data.apiKey),
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
      },
      tags: { name: 'add-to-cart', flow: 'shopping' },
    });
    
    check(addToCartResponse, {
      'Item added to cart': (r) => r.status === 200,
    });
    
    cartOperations.add(1);
    sleep(randomIntBetween(1, 2));
  }
  
  // 3. View cart
  const cartResponse = http.get(`${data.baseUrl}/get?action=view_cart`, {
    headers: {
      ...getHeaders(data.apiKey),
      'Authorization': `Bearer ${sessionToken}`,
    },
    tags: { name: 'view-cart', flow: 'shopping' },
  });
  
  check(cartResponse, { 'Cart viewed': (r) => r.status === 200 });
  
  sleep(2);
  
  // 4. Checkout process
  const checkoutData = {
    action: 'checkout',
    payment_method: 'credit_card',
    shipping_address: '123 Test St, Test City, TC 12345',
    session_token: sessionToken,
  };
  
  const checkoutResponse = http.post(`${data.baseUrl}/post`, JSON.stringify(checkoutData), {
    headers: {
      ...getHeaders(data.apiKey),
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sessionToken}`,
    },
    tags: { name: 'checkout', flow: 'shopping' },
  });
  
  const checkoutSuccessful = check(checkoutResponse, {
    'Checkout successful': (r) => r.status === 200,
    'Checkout response time OK': (r) => r.timings.duration < 1000,
  });
  
  checkoutSuccess.add(checkoutSuccessful);
  
  sleep(1);
}

// User Flow: Flash Sale
function flashSaleFlow(data) {
  // High-intensity product viewing during flash sale
  const flashSaleProduct = { id: 999, name: 'Flash Sale Item', price: 99.99 };
  
  // Rapid product page loads
  const productResponse = http.get(`${data.baseUrl}/get?flash_sale_product=${flashSaleProduct.id}`, {
    headers: getHeaders(data.apiKey),
    tags: { name: 'flash-sale-product', flow: 'flash_sale' },
  });
  
  check(productResponse, {
    'Flash sale product loaded': (r) => r.status === 200,
    'Flash sale response time acceptable': (r) => r.timings.duration < 1000,
  });
  
  // Attempt to add to cart quickly
  const quickAddResponse = http.post(`${data.baseUrl}/post`, JSON.stringify({
    action: 'quick_add',
    product_id: flashSaleProduct.id,
    quantity: 1,
  }), {
    headers: {
      ...getHeaders(data.apiKey),
      'Content-Type': 'application/json',
    },
    tags: { name: 'quick-add', flow: 'flash_sale' },
  });
  
  check(quickAddResponse, {
    'Quick add processed': (r) => r.status === 200 || r.status === 409, // 409 = out of stock
  });
  
  // Minimal sleep for flash sale scenario
  sleep(0.1);
}

// Helper Functions
function getHeaders(apiKey) {
  return {
    'User-Agent': 'k6-load-test/1.0',
    'Accept': 'application/json',
    'X-API-Key': apiKey,
    'Accept-Encoding': 'gzip, deflate',
  };
}

// Teardown
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log('🏁 E-commerce Load Test Completed');
  console.log(`   Duration: ${duration.toFixed(2)} seconds`);
  console.log('   Check detailed metrics in Grafana dashboard');
}

// Custom Summary
export function handleSummary(data) {
  console.log('\n🛒 E-COMMERCE TEST SUMMARY');
  console.log('============================');
  
  const metrics = data.metrics;
  
  console.log('📊 Request Metrics:');
  console.log(`   Total Requests: ${metrics.http_reqs?.values.count || 0}`);
  console.log(`   Failed Requests: ${((metrics.http_req_failed?.values.rate || 0) * 100).toFixed(2)}%`);
  console.log(`   Request Rate: ${(metrics.http_reqs?.values.rate || 0).toFixed(2)} req/s`);
  
  console.log('\n⏱️  Performance Metrics:');
  console.log(`   Avg Response Time: ${(metrics.http_req_duration?.values.avg || 0).toFixed(2)}ms`);
  console.log(`   90th Percentile: ${(metrics.http_req_duration?.values['p(90)'] || 0).toFixed(2)}ms`);
  console.log(`   95th Percentile: ${(metrics.http_req_duration?.values['p(95)'] || 0).toFixed(2)}ms`);
  console.log(`   Max Response Time: ${(metrics.http_req_duration?.values.max || 0).toFixed(2)}ms`);
  
  console.log('\n🛍️  Business Metrics:');
  console.log(`   Login Errors: ${metrics.login_errors?.values.count || 0}`);
  console.log(`   Cart Operations: ${metrics.cart_operations?.values.count || 0}`);
  console.log(`   Checkout Success Rate: ${((metrics.checkout_success_rate?.values.rate || 0) * 100).toFixed(2)}%`);
  console.log(`   Avg Product View Time: ${(metrics.product_view_duration?.values.avg || 0).toFixed(2)}ms`);
  
  return {
    'stdout': '', // Suppress default k6 summary since we have custom one
    'summary.json': JSON.stringify(data, null, 2),
  };
}