import http from 'k6/http';
import { check, sleep } from 'k6';
//kiểm tra khả năng tiếp nhận, phản hồi HTTP request của backend
export const options = {
    stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 200 },
        { duration: '1m', target: 500 },
        { duration: '1m', target: 1000 },
        { duration: '1m', target: 2000 },
        { duration: '30s', target: 0 },
    ],

    thresholds: {
        http_req_failed: ['rate<0.01'],
        http_req_duration: ['p(95)<1000'],
    },
};

export default function () {
    const response = http.get('http://localhost:3000/');

    check(response, {
        'Status is 200': (r) => r.status === 200,
        'Response under 1 second': (r) => r.timings.duration < 1000,
    });

    sleep(1);
}