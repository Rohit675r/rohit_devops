#!/usr/bin/env bash
set -euo pipefail
: "${APP:?}" "${IMAGE:?}" "${NAMESPACE:?}"
kubectl get namespace "$NAMESPACE" >/dev/null
kubectl -n "$NAMESPACE" get secret mongo-uri >/dev/null
active=$(kubectl -n "$NAMESPACE" get service "$APP" -o jsonpath='{.spec.selector.color}' --ignore-not-found)
if [[ "$active" == "green" ]]; then export COLOR=blue; else export COLOR=green; fi
echo "Deploying $IMAGE to $NAMESPACE, candidate=$COLOR, previous=${active:-none}"
envsubst '$APP $IMAGE $NAMESPACE $COLOR' < ops/k8s/deployment.yaml | kubectl apply -f -
kubectl -n "$NAMESPACE" rollout status deployment/"$APP-$COLOR" --timeout=180s
kubectl -n "$NAMESPACE" port-forward service/"$APP-candidate" 8080:80 >/tmp/port-forward.log 2>&1 &
forward_pid=$!
trap 'kill "$forward_pid" 2>/dev/null || true' EXIT
ready=false
for i in {1..30}; do if curl -fsS http://127.0.0.1:8080/health; then ready=true; break; fi; sleep 1; done
[[ "$ready" == true ]]
BASE_URL=http://127.0.0.1:8080 npm run test:e2e
# Only switch the stable service after candidate checkout has passed.
envsubst '$APP $COLOR $NAMESPACE' < ops/k8s/service.yaml | kubectl apply -f -
echo "Promoted $COLOR. Previous slot: ${active:-none}. Keep it running for rollback."
