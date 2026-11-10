# Verification record

- Student: Rohit
- Date: 10 November 2026
- API and checkout tests: 20 passed.
- Coverage for server/app.js and server/order.js: 98.27% statements, 89.47% branches, 100% functions and lines.
- Production frontend build: passed.
- Selenium: catalog, unique feature, search, cart persistence after refresh, optional service pricing, successful demo checkout and 390px mobile overflow check passed.
- Real product photography replaced CSS illustrations; browser checks confirm all photographs load. Desktop and mobile screenshots visually reviewed.
- Docker Compose configuration: validation passed. Docker engine unavailable; container image execution and MongoDB persistence have not been verified.
- Local execution uses explicit JSON demo storage. MongoDB is wired through MONGODB_URI and Docker Compose, but has not been exercised here.
- Jenkins 2.580.2 on Java 21 installed locally. Each job build 2 finished SUCCESS with 20 tests passed and a successful frontend build. Docker was explicitly disabled for these application-only runs. Local source copy was used; GitHub SCM is not connected yet. Jenkinsfiles validated using the Jenkins linter. Local Kubernetes/Docker Hub scripts are supplied but not executed. SonarQube and monitoring remain unverified. Disabled GitHub Actions examples are retained in .github/examples.
- ELK and Slack remain extension tasks. No AWS EKS provisioning performed.

Local preview: http://localhost:4202
