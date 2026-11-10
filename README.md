# VoltCart

Rohit's distinct MERN DevOps practical. Smart gear. Clear specs. Zero guesswork. Discover the essentials for your next great setup.

## Run locally (no Docker required)

Open PowerShell in this folder:

```powershell
npm.cmd ci
npm.cmd run dev
```

Open http://localhost:4102. The API runs on 4202. Local development explicitly uses JSON demo storage unless MONGODB_URI is set. No real payments or shipping. Enter fictional details only.

## Production build

```powershell
npm.cmd test
npm.cmd run build
npm.cmd start
```

Open http://localhost:4202. To use MongoDB, set `$env:MONGODB_URI='mongodb://127.0.0.1:27017/voltcart'` before starting.

## Docker and MongoDB

Start Docker Desktop first, then run `docker compose up --build -d`. Open http://localhost:4202. Orders persist in the named MongoDB volume. `docker compose down` preserves that volume.

## Monitoring

Set `$env:GRAFANA_PASSWORD='choose-a-local-password'` then run `docker compose --profile monitoring up -d`. Prometheus: http://localhost:4302. Grafana: http://localhost:4402 (admin and your chosen password; local fallback password is local-demo-change-me). Prometheus data source is provisioned. In Grafana Explore, query `sum by (status) (rate(shop_http_requests_total[5m]))`. /metrics and /health are provided by the app. Do not expose these local demo services publicly.

## Browser test

With a built app running, run `npm.cmd run test:e2e`. Chrome and Selenium Manager internet access are required on first run. CI uses Chrome on Ubuntu.

## Jenkins CI/CD

Use the root Jenkinsfile and docs/JENKINS.md. Create a separate GitHub repository for this project and configure Jenkins Pipeline script from SCM with Script Path Jenkinsfile. Local learning jobs use the current project folder until GitHub is connected. GitHub Actions examples are disabled in .github/examples. No AWS account is needed.

## Practical file

See docs/PRACTICAL.md for the case study and evidence checklist. Understand and adapt the implementation before submitting; describe assistance according to your course rules.

## Windows shortcut

Double-click START-HERE.cmd to install missing packages, build, open the browser and run the app. Keep its terminal open while using the store. Stop it with Ctrl+C.

## Jenkins is the primary practical pipeline

Use the root Jenkinsfile and docs/JENKINS.md for Jenkins, Docker Hub and local Kubernetes. Disabled GitHub Actions examples are retained in .github/examples for reference.
