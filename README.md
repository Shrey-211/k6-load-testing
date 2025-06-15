

## 🚀 Getting Started

### 1. Clone this repository

```bash
git clone <your-repo-url>
cd <your-project>
```

---

### 2. Run InfluxDB & Grafana (Locally)

```bash
docker-compose -f docker-compose.k6.yml up -d
```

* InfluxDB: [http://localhost:8086](http://localhost:8086)
* Grafana: [http://localhost:3000](http://localhost:3000)
  (Login: `admin` / `admin` by default)

---

### 3. Run k6 Test Manually (Optional)

```bash
k6 run --out influxdb=http://k6:k6pass@localhost:8086/k6 scripts/scenario.js
```

This sends the result to InfluxDB and you can view it in Grafana.

---

## ⚙️ GitHub Actions CI

### 🖥️ Self-Hosted Runner Required

To run everything locally (k6 + Docker containers):

1. Set up a GitHub **self-hosted runner**
2. Ensure **Docker** is installed and running
3. Start the runner on your local machine using:

   ```bash
   ./run.sh
   ```

---

### 🧪 Workflow Trigger

The test is triggered on **every `push`**:

```yaml
on: [push]
```

### 🧰 Key Workflow Steps

* Start Docker services (InfluxDB + Grafana)
* Wait for services to initialize
* Install `k6` if not already installed
* Run `k6` test and send output to InfluxDB
* (Optional) Export dashboard snapshot or archive results

---

## 📊 Grafana Dashboard

To set up the k6 dashboard:

1. Go to Grafana → Add Data Source → Select **InfluxDB**
2. URL: `http://influxdb:8086`
3. DB: `k6`, User: `k6`, Password: `k6pass`
4. Import k6 dashboard: [Official JSON](https://grafana.com/grafana/dashboards/2587)

---

## 📁 docker-compose.k6.yml Volumes

Your metrics and dashboards are **persisted** across runs:

```yaml
volumes:
  grafana-storage:
  influxdb-data:
```

---

## 🧼 Cleanup

To stop and remove containers:

```bash
docker-compose -f docker-compose.k6.yml down
```

To stop the GitHub self-hosted runner:

```bash
CTRL + C  # if running in terminal
```

---

## ✅ Future Improvements

* Export Grafana dashboards as artifacts
* Use Grafana API for auto-provisioning dashboards
* Schedule regular performance tests via CRON triggers

---

## 📬 Contact

Have questions or suggestions? Open an issue or reach out!

