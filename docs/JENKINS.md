# VoltCart Jenkins workflow

The Jenkinsfile replaces GitHub Actions as the practical's primary pipeline. GitHub remains the source code host. AWS is not used. The local Jenkins runs Windows PowerShell steps with Node/npm, Git, Docker Desktop, Chrome and kubectl installed on its Windows build agent.

## First local run

Create Pipeline job rohit-voltcart-ci. For a local learning run, paste the Jenkinsfile into Pipeline script and set LOCAL_SOURCE to the absolute project folder. For the assessed GitHub workflow, select Pipeline script from SCM, Git, your own repository, main, Script Path Jenkinsfile, and leave LOCAL_SOURCE empty. Do not use the reference student's repository.

RUN_DOCKER defaults to true. If Docker is unavailable, an explicitly selected false run validates only installation, Jest and frontend build. Its description states that Docker was not executed; do not use that run as container deployment evidence.

The full local pipeline builds a versioned Docker image, starts a dedicated MongoDB container with a persistent volume, runs the app on http://localhost:5202, checks its API and executes the Selenium checkout. Existing manual app previews on port 4202 are separate. The pipeline owns only containers voltcart-ci-app and voltcart-ci-mongo. The CI app is replaced on subsequent builds; its MongoDB volume persists.

## Docker Hub

Create your own public Docker Hub repository named voltcart. Add a Jenkins Username with password credential with ID dockerhub: your Docker Hub username and an access token as password. Check PUBLISH_IMAGE and set DOCKERHUB_USER to your namespace. Credentials are used through Jenkins bindings and a temporary Docker configuration; no token belongs in source code.

## Local Kubernetes and approval

Enable Kubernetes in Docker Desktop, or start Minikube. Check the local context with kubectl. Keep the default storage provisioner enabled and allow capacity for the two application replicas plus MongoDB per environment.

Check DEPLOY_LOCAL_K8S together with RUN_DOCKER and PUBLISH_IMAGE. Choose docker-desktop or minikube. The Windows deployment script creates isolated staging and production namespaces, persistent local MongoDB storage and a MongoDB connection secret. It tests the inactive blue/green application before switching the service selector. A Jenkins approval gate precedes production. The old color is retained. No EKS or cloud cluster is targeted.

To view production: kubectl --context docker-desktop -n voltcart-production port-forward service/voltcart 7202:80, then visit http://localhost:7202. For rollback inspect the service selector and old deployment readiness, then use kubectl edit service voltcart -n voltcart-production --context docker-desktop to set the selector color back. First release has no previous version.

Local MongoDB intentionally has no external port or account/password in this classroom setup. Demo data only. Never expose this setup as a public production store. Selenium smoke tests insert fictional demo orders in whichever environment is tested.

## Evidence

Capture your job configuration, source checkout, 20 passing Jest tests, frontend build, Docker build, healthy container using MongoDB, Selenium checkout and final Jenkins result. Capture Docker Hub tag and Kubernetes staging, approval, color switch and rollback only after actually executing those optional stages. Existing GitHub Actions YAML is retained as an alternative; Jenkins is the demonstrated route.
