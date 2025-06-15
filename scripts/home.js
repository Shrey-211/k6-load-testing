import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 20,
  duration: '1m',
  thresholds: {
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  let res = http.get('https://quickpizza.grafana.com/');
  check(res, {
    'home page loaded': (r) => r.status === 200,
  });
  sleep(1);
}
