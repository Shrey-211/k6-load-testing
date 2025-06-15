# QuickPizza Load Testing (k6)

## 📌 Test Goals
- Load homepage
- Simulate order placement
- Test under 50 VUs

## 🚀 Run Test

```bash
k6 run scripts/home.js
k6 run scripts/orderPizza.js
k6 run scripts/scenario.js
