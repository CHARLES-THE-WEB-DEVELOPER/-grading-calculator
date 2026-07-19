# Deployment Guide for Grading Calculator

## Overview

This guide explains how to scale the grading calculator to handle 1,000,000 concurrent users.

## Quick Start (Local)

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Production mode (uses all CPU cores)
NODE_ENV=production npm start
```

## Docker Deployment (Recommended for Testing)

### Build & Run

```bash
# Build image
docker build -t grading-calculator .

# Run single instance
docker run -p 3000:3000 grading-calculator

# Run full stack (4 instances + load balancer)
docker-compose up -d

# View logs
docker-compose logs -f

# Verify
curl http://localhost/health
```

## Kubernetes Deployment (for 1M users)

### Prerequisites

```bash
kubectl version
helm version
```

### Deploy to Kubernetes

```yaml
# kubernetes-deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grading-calculator
spec:
  replicas: 100 # Start with 100 pods
  selector:
    matchLabels:
      app: grading-calculator
  template:
    metadata:
      labels:
        app: grading-calculator
    spec:
      containers:
        - name: grading-calculator
          image: grading-calculator:latest
          ports:
            - containerPort: 3000
          resources:
            requests:
              cpu: 500m
              memory: 256Mi
            limits:
              cpu: 1000m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: grading-calculator-service
spec:
  selector:
    app: grading-calculator
  type: LoadBalancer
  ports:
    - protocol: TCP
      port: 80
      targetPort: 3000

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: grading-calculator-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: grading-calculator
  minReplicas: 100
  maxReplicas: 1000
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

Deploy:

```bash
kubectl apply -f kubernetes-deployment.yml
kubectl get pods
kubectl get hpa
```

## AWS Deployment (EC2 + ECS)

### Option 1: EC2 Auto Scaling

```bash
# 1. Create AMI with Node.js
# 2. Create Launch Template
# 3. Create Auto Scaling Group

# Min: 100 instances
# Max: 1000 instances
# Target: 70% CPU

# Configure Load Balancer (ALB/NLB)
# Enable health checks
# Enable sticky sessions (optional)
```

### Option 2: ECS Fargate

```bash
# Create task definition
# Configure: 256 CPU, 512 memory
# Set replica count: 100-1000
# Enable auto-scaling
# Use Application Load Balancer
```

## Performance Optimization

### 1. Node.js Clustering (Built-in)

- Server automatically uses all CPU cores
- Auto-restarts failed workers
- Zero-downtime reloads

### 2. Caching Strategy

- In-memory cache for frequently calculated GPAs
- Redis for distributed cache (optional)
- HTTP caching headers
- Service Worker for offline

### 3. Database Optimization

- Connection pooling
- Query optimization
- Indexes on frequently used fields
- Read replicas for scaling

### 4. Frontend Optimization

- Service Worker caching
- Gzip compression
- Image optimization
- Lazy loading

## Load Testing

### Test with Apache Bench

```bash
# 1M requests with 10K concurrent connections
ab -n 1000000 -c 10000 http://your-domain.com/

# Add delay between requests
ab -n 100000 -c 5000 -t 30 http://your-domain.com/
```

### Test with wrk

```bash
# Install wrk: https://github.com/wg/wrk
wrk -t12 -c10000 -d30s http://your-domain.com/

# With custom script for API
wrk -t12 -c10000 -d30s -s api.lua http://your-domain.com/
```

### Test with Artillery

```bash
npm install -g artillery

# Create config
echo '{
  "config": {
    "target": "http://localhost:3000",
    "phases": [
      { "duration": 60, "arrivalRate": 100000 }
    ]
  },
  "scenarios": [{
    "name": "Calculate GPA",
    "flow": [{
      "post": {
        "url": "/api/calculate/gpa",
        "json": {
          "courses": [{"score": 85, "credits": 3}],
          "institutionId": "uni-a"
        }
      }
    }]
  }]
}' > load-test.yml

artillery run load-test.yml
```

## Monitoring & Observability

### Prometheus Metrics

```bash
# Access prometheus
# http://localhost:9090

# Query examples
- rate(http_requests_total[5m])
- histogram_quantile(0.95, http_request_duration_seconds_bucket)
```

### Logs

```bash
# Docker
docker-compose logs -f app-1

# Kubernetes
kubectl logs -f deployment/grading-calculator

# Application logs in /var/log/
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## Scaling Limits & Bottlenecks

### Per Instance

- Max: 50K concurrent connections
- Max: 10K requests/second
- Memory: 200-300MB

### Network

- Bandwidth: Plan for 1Gbps minimum
- Latency: Aim for <100ms
- Use CDN for static assets

### Database

- Max connections: 200-400 per instance
- Use connection pooling
- Plan for replication/clustering

## Cost Estimation (1M concurrent users)

### AWS ECS Fargate

- Compute: 100-1000 tasks × $0.004/hour = $400-4000/hour
- Monthly: $300K-3M

### Google Cloud Run

- More cost-efficient due to per-request pricing
- Expected: $100K-500K/month

### Kubernetes (self-hosted)

- Node instances: 100-500 machines
- If t3.xlarge: 100 × $0.166 = $16.6/hour
- Monthly: ~$12K

## Security Checklist

- [ ] HTTPS/TLS enabled
- [ ] Rate limiting configured
- [ ] CORS properly set
- [ ] Input validation in place
- [ ] Security headers added
- [ ] Secrets in .env (not in repo)
- [ ] Database backups enabled
- [ ] Logging & monitoring active
- [ ] DDoS protection enabled
- [ ] Regular security audits

## Troubleshooting

### High Memory Usage

```bash
# Check memory per process
ps aux | sort -k3 -r | head

# Reduce cache size in config
# Enable garbage collection
node --max-old-space-size=512 server/index.js
```

### High CPU Usage

- Check for infinite loops
- Profile with: `node --prof server/index.js`
- Scale up with more instances

### Connection Limits

```bash
# Increase system limits (Linux)
ulimit -n 65536

# Permanent: Edit /etc/security/limits.conf
* soft nofile 65536
* hard nofile 65536
```

## Further Reading

- [Node.js Cluster Module](https://nodejs.org/api/cluster.html)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Scaling](https://kubernetes.io/docs/concepts/configuration/overview/)
- [Nginx Load Balancing](https://nginx.org/en/docs/http/load_balancing.html)
- [Performance Testing](https://k6.io/docs/)

---

**Ready to deploy at scale?** Start with Docker Compose, then move to Kubernetes for production!
