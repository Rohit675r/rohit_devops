# VoltCart: DevOps case study

Student: Rohit

## Aim
Study continuous integration, container delivery, deployment and operational visibility using a MERN demonstration application.

## Background and scope
VoltCart is a fictional technology accessories retailer. Rohit's application demonstrates specification comparison and optional express delivery. Prices, ratings, stock and orders are demonstration data.

## Problem statement
The supplied scenario assumes slow manual integration, lengthy deployments, late defect discovery and no monitoring. These are scenario assumptions, not measured historical results.

## Implementation
React + Vite frontend → Express API → MongoDB when configured. Local demo mode uses a JSON order file to allow development without a running database. Server recomputes prices, validates quantities and stores orders. Demo checkout has no payment processing, authentication or actual shipment. The catalog is versioned in catalog.json; MongoDB stores orders. Stock is a per-order validation limit, not a transactional inventory system.

## Pipeline
Git source (local copy during initial setup, GitHub SCM for the final demonstration) → Jenkins → Jest tests and coverage → Vite build → Docker image → MongoDB-backed local staging → Selenium checkout. Optional Jenkins stages publish to Docker Hub, deploy local Kubernetes staging and wait for approval before the local production blue-green switch. AWS is not used. SonarQube remains an extension task.

## Tools
Git/GitHub, Jenkins, Jest/Supertest, Docker, MongoDB, Selenium, Kubernetes, SonarQube, Prometheus/Grafana. JSON request logs are ready for collection; ELK and Slack are extension tasks, not installed integrations.

## Evidence to collect
1. Homepage and the student-specific feature.
2. Category/search results and cart.
3. Successful demo order with reference.
4. Passing unit tests, coverage and production build.
5. Jenkins pipeline run and repository checkout.
6. Docker containers and MongoDB order after starting Docker.
7. Staging test, production approval, service selector before/after promotion.
8. Prometheus metric query and Grafana Explore view.

## Observations
Fill in measured test counts, pipeline duration, deployment time and rollback behavior after running the corresponding stage. Do not claim EKS, zero downtime, reduced defect rates or shorter release cycles without evidence.

## Conclusion
This project provides a repeatable application build and test process and deployable configuration. Cloud execution and monitoring evidence depend on the actual services configured by the student.
