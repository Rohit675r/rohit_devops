# Deployment runbook — VoltCart

These are supplied configurations, not evidence of a completed cloud deployment.

## Prerequisites

Create a GitHub repository and Docker Hub public repository named voltcart. Configure repository secrets DOCKERHUB_USERNAME and DOCKERHUB_TOKEN. A public image avoids registry credentials in the cluster; private images require imagePullSecrets, which are not configured here.

Use a reachable Kubernetes cluster (local with a self-hosted runner, or a cloud cluster). GitHub-hosted runners cannot reach a laptop-only Minikube cluster. EKS also needs AWS credentials and the aws CLI for an exec-based kubeconfig; this generic workflow does not provision EKS or configure AWS authentication. Use a narrowly scoped cluster credential and namespace permissions.

Create namespaces voltcart-staging and voltcart-production. In each namespace create a Secret called mongo-uri with key uri holding a MongoDB connection string. Use separate staging and production databases. Do not commit secrets. The database must be reachable from the cluster; localhost refers to the pod itself.

Create staging and production GitHub Environments. Add the environment secret KUBE_CONFIG_BASE64, containing a base64-encoded working kubeconfig for that environment. Set required reviewers and main-only deployment protection on production. **The YAML environment name alone does not enforce approval.** Restrict runner credential permissions appropriately.

## Release

Run the Staging and approved production workflow from main. It tests/builds and publishes a commit-tagged image. Staging creates the inactive color deployment, waits for readiness and runs a Selenium checkout through a temporary port-forward. Only then does it switch the stable service. Production uses the same image after the environment approval gate. The former deployment remains running.

This exercise uses demo checkout data during smoke tests, including production. Do not connect it to real payments or real fulfillment. Database schema compatibility must be preserved across both colors.

## View and rollback

Run kubectl -n voltcart-production port-forward service/voltcart 8080:80, then open http://localhost:8080. For external access add an ingress/TLS configuration appropriate to your cluster.

Inspect the current selector with kubectl -n voltcart-production get service voltcart -o yaml. To roll back, confirm the previous color is Ready, then change spec.selector.color on that service to the previous color using kubectl edit service voltcart -n voltcart-production. Do not change the app selector. Test /health and an order again, then capture the evidence. First deployment has no older slot to roll back to.

## Monitoring and logs

The local Compose monitoring profile supplies Prometheus and Grafana with a provisioned data source. Kubernetes monitoring discovery, dashboards, alert rules, ELK collectors and Slack webhooks remain optional extension work. The application emits structured JSON logs to stdout, which can be inspected through kubectl logs or docker compose logs app. No alert delivery is claimed.

## References

- [Vite guide](https://vite.dev/guide/)
- [Docker Compose startup order](https://docs.docker.com/compose/how-tos/startup-order/)
- [GitHub deployment environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
- [Kubernetes Service selectors](https://kubernetes.io/docs/concepts/services-networking/service/)
