import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10,
  duration: '1m',
};

const payload = JSON.stringify({
  pizza: "margherita",
  size: "medium",
  address: "221B Baker Street"
});

const params = {
  headers: {
    'Content-Type': 'application/json',
  },
};

export default function () {
  let res = http.post('https://quickpizza.grafana.com/api/order', payload, params);
  check(res, {
    'order submitted': (r) => r.status === 200 || r.status === 201,
  });
  sleep(1);
}
