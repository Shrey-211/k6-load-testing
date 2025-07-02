import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';

const users = new SharedArray('users', function () {
  return JSON.parse(open('../data/users.json'));
});

export let options = {
  vus: 10,
  duration: '1m',
};

export default function () {
  const user = users[Math.floor(Math.random() * users.length)];

  const payload = JSON.stringify(user);
  const headers = { headers: { 'Content-Type': 'application/json' } };

  let res = http.post('https://quickpizza.grafana.com/api/order', payload, headers);

  check(res, {
    'order placed': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}
