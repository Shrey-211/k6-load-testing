import http from 'k6/http';
import { check, sleep, group } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<800'],
  },
};

export default function () {
  group("Home Page", function () {
    let res = http.get('https://quickpizza.grafana.com/');
    check(res, { 'home loaded': (r) => r.status === 200 });
    sleep(1);
  });

  group("Place Order", function () {
    let res = http.post('https://quickpizza.grafana.com/api/order', JSON.stringify({
      pizza: "pepperoni", size: "large", address: "Mumbai"
    }), { headers: { 'Content-Type': 'application/json' } });

    check(res, {
      'order successful': (r) => r.status === 200 || r.status === 201,
    });
    sleep(1);
  });
}
