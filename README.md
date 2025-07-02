# E-commerce Performance Testing Suite

A comprehensive performance testing environment for e-commerce APIs utilizing K6, Grafana, and InfluxDB for load testing, monitoring, and visualization.

## Overview

This project provides a complete testing infrastructure that enables:

- **Load Testing**: K6-based performance testing with realistic e-commerce scenarios
- **Data Storage**: InfluxDB time-series database for metrics collection
- **Visualization**: Grafana dashboards for real-time monitoring and analysis

## Architecture

The testing suite consists of four main components:

- **K6 Load Testing Engine**: Executes performance tests and generates metrics
- **InfluxDB Database**: Stores time-series performance data
- **Grafana Dashboard**: Provides visualization and monitoring capabilities
- **E-commerce API**: Target application for performance testing

## Project Structure

```
.
├── docker-compose.yml
├── influxdb/
│   └── influxdb.conf
├── grafana/
│   ├── dashboards/
│   │   └── k6-load-testing-dashboard.json
│   └── provisioning/
│       ├── datasources/
│       │   └── influxdb.yml
│       └── dashboards/
│           └── dashboard.yml
├── k6/
│   ├── scripts/
│   │   └── advanced-ecommerce-test.js
│   └── data/
├── ecommerce-api/
│   ├── server.js
│   └── package.json
└── README.md
```

## Prerequisites

- Docker Desktop 4.0 or higher
- Node.js 16.x or higher
- Git version control system
- Minimum 4GB RAM available for containers

## Installation and Setup

### 1. Repository Setup

```bash
git clone https://github.com/your-username/k6-load-testing.git
cd k6-load-testing
```

### 2. Infrastructure Deployment

Deploy the monitoring infrastructure:

```bash
docker-compose up -d influxdb grafana
```

Allow 30-60 seconds for services to initialize completely.

**Service Endpoints:**
- Grafana Dashboard: http://localhost:3000
- InfluxDB Interface: http://localhost:8086

**Default Credentials:**
- Grafana: `admin` / `admin123`

### 3. Application Backend Setup

Launch the e-commerce API server:

```bash
cd ecommerce-api
npm install
node server.js
```

The API will be available at: http://localhost:5000

## Test Execution

### Running Performance Tests

Execute the comprehensive e-commerce load test:

```bash
docker-compose run --rm k6 run /scripts/advanced-ecommerce-test.js
```

**Test Scenarios Include:**
- User browsing patterns
- Shopping cart operations
- Checkout processes
- High-traffic flash sale simulation

All performance metrics are automatically collected in InfluxDB and visualized through Grafana.

## Monitoring and Analysis

### Accessing Grafana Dashboard

1. Navigate to http://localhost:3000
2. Login with credentials: `admin` / `admin123`
3. Access **Dashboards → K6 Load Testing Results**
4. Monitor real-time performance metrics during test execution

### Key Performance Indicators

The dashboard tracks the following metrics:

- **Virtual Users (VUs)**: Concurrent user simulation count
- **Request Rate**: Requests per second throughput
- **Error Rate**: Failed request percentage
- **Response Time**: HTTP request duration distribution
- **Business Metrics**: Checkout success rate, page view duration

### Data Validation

Ensure data visibility by verifying:

- Test execution completion status
- Time range configuration (recommend "Last 15 minutes")
- Data source mapping to InfluxDB-K6 instance

## Troubleshooting

### No Data in Grafana Dashboard

**Resolution Steps:**
1. Verify K6 test execution completed successfully
2. Confirm backend API service is running on port 5000
3. Validate InfluxDB data collection:

```bash
docker exec -it k6-influxdb influx
use k6
show measurements
```

### Connection Refused Error

**Common Causes:**
- Backend API service not running
- Port conflicts on localhost:5000
- Docker network connectivity issues

**Resolution:**
Ensure the e-commerce API is running before test execution:

```bash
cd ecommerce-api
node server.js
```

## Environment Cleanup

### Stop Services

```bash
docker-compose down
```

### Complete Cleanup

Remove all containers, volumes, and networks:

```bash
docker-compose down -v --remove-orphans
```

## Technical Documentation

### Performance Testing Best Practices

- Configure appropriate ramp-up periods for realistic load simulation
- Monitor system resources during test execution
- Establish baseline performance metrics before optimization
- Document test scenarios and expected outcomes

### Scaling Considerations

- Adjust K6 virtual user limits based on target system capacity
- Configure InfluxDB retention policies for long-term data storage
- Optimize Grafana dashboard queries for large datasets

## References

- [K6 Official Documentation](https://k6.io/docs/)
- [Grafana InfluxDB Data Source Guide](https://grafana.com/docs/grafana/latest/datasources/influxdb/)
- [InfluxDB 1.x Documentation](https://docs.influxdata.com/influxdb/v1.8/)
- [Docker Compose Reference](https://docs.docker.com/compose/)

## Contributing

Please refer to the project's contribution guidelines and code of conduct before submitting pull requests or issues.

## License

This project is licensed under the MIT License. See LICENSE file for details.