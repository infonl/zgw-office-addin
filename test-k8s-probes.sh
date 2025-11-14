#!/bin/bash
# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

set -e

echo "🔬 Testing Kubernetes Health Probes"
echo "===================================="
echo

# Configuration
CLUSTER_NAME="office-addin-test"
NAMESPACE="office-addin-test"
CHART_PATH="./charts/office-add-in"
RELEASE_NAME="test-release"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if cluster exists
if kind get clusters 2>/dev/null | grep -q "^${CLUSTER_NAME}$"; then
    echo "📦 Using existing Kind cluster: ${CLUSTER_NAME}"
else
    echo "🏗️  Creating Kind cluster..."
    kind create cluster --name ${CLUSTER_NAME} --config kind-config.yaml
    echo "✅ Cluster created"
fi

echo
echo "📁 Creating namespace if it doesn't exist..."
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

echo
echo "🐳 Loading local Docker images into Kind..."
echo "   - Loading frontend image..."
kind load docker-image ghcr.io/infonl/zgw-office-add-in-frontend:dev --name ${CLUSTER_NAME}
echo "   - Loading backend image..."
kind load docker-image ghcr.io/infonl/zgw-office-add-in-backend:dev --name ${CLUSTER_NAME}

echo
echo "🚢 Deploying with Helm (using local images)..."
helm upgrade --install ${RELEASE_NAME} ${CHART_PATH} \
  --namespace ${NAMESPACE} \
  --set frontend.image.repository=ghcr.io/infonl/zgw-office-add-in-frontend \
  --set frontend.image.tag=dev \
  --set frontend.image.pullPolicy=Never \
  --set frontend.frontendUrl="https://localhost:30443" \
  --set frontend.enableHttps=false \
  --set backend.image.repository=ghcr.io/infonl/zgw-office-add-in-backend \
  --set backend.image.tag=dev \
  --set backend.image.pullPolicy=Never \
  --set backend.jwtSecret="test-secret-for-local-development-only" \
  --set backend.apiBaseUrl="http://mock-api:8080" \
  --wait \
  --timeout=2m

echo
echo "✅ Deployment complete!"
echo

echo "📊 Checking pod status..."
kubectl get pods -n ${NAMESPACE}

echo
echo "🔍 Monitoring health probes..."
echo "================================"
echo

# Get pod names
FRONTEND_POD=$(kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/component=frontend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
BACKEND_POD=$(kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -z "$FRONTEND_POD" ] || [ -z "$BACKEND_POD" ]; then
    echo "⚠️  Waiting for pods to be created..."
    sleep 5
    FRONTEND_POD=$(kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/component=frontend -o jsonpath='{.items[0].metadata.name}')
    BACKEND_POD=$(kubectl get pods -n ${NAMESPACE} -l app.kubernetes.io/component=backend -o jsonpath='{.items[0].metadata.name}')
fi

echo "Frontend Pod: ${FRONTEND_POD}"
echo "Backend Pod:  ${BACKEND_POD}"
echo

# Function to check probe status
check_probes() {
    local POD=$1
    local NAME=$2
    
    echo "📋 ${NAME} Probe Status:"
    echo "   Pod: ${POD}"
    
    # Get pod conditions
    local READY=$(kubectl get pod ${POD} -n ${NAMESPACE} -o jsonpath='{.status.conditions[?(@.type=="Ready")].status}')
    local CONTAINERS_READY=$(kubectl get pod ${POD} -n ${NAMESPACE} -o jsonpath='{.status.conditions[?(@.type=="ContainersReady")].status}')
    
    # Get restart count
    local RESTARTS=$(kubectl get pod ${POD} -n ${NAMESPACE} -o jsonpath='{.status.containerStatuses[0].restartCount}')
    
    # Get probe results from events
    echo "   Ready: ${READY}"
    echo "   ContainersReady: ${CONTAINERS_READY}"
    echo "   Restarts: ${RESTARTS}"
    
    # Check for probe failures in events
    local PROBE_FAILURES=$(kubectl get events -n ${NAMESPACE} --field-selector involvedObject.name=${POD} \
        | grep -i "probe\|liveness\|readiness" | tail -5 || echo "")
    
    if [ -n "$PROBE_FAILURES" ]; then
        echo "   Recent probe events:"
        echo "$PROBE_FAILURES" | sed 's/^/     /'
    fi
    
    echo
}

# Monitor probes
echo "Waiting for probes to stabilize..."
sleep 10

check_probes "${FRONTEND_POD}" "Frontend"
check_probes "${BACKEND_POD}" "Backend"

echo "🔬 Testing health endpoints directly..."
echo "========================================"

# Test backend health endpoint
echo "Testing backend health endpoint..."
kubectl exec -n ${NAMESPACE} ${BACKEND_POD} -- wget -O- -q http://localhost:3003/health && echo " ✅" || echo " ❌"

# Test frontend health endpoint  
echo "Testing frontend health endpoint..."
kubectl exec -n ${NAMESPACE} ${FRONTEND_POD} -- wget -O- -q http://localhost:80/health && echo " ✅" || echo " ❌"

echo
echo "📊 Final Pod Status:"
kubectl get pods -n ${NAMESPACE} -o wide

echo
echo "📋 Probe Configuration:"
echo "======================"
kubectl get pod ${BACKEND_POD} -n ${NAMESPACE} -o jsonpath='{.spec.containers[0].livenessProbe}' | jq . && echo
kubectl get pod ${BACKEND_POD} -n ${NAMESPACE} -o jsonpath='{.spec.containers[0].readinessProbe}' | jq . && echo

echo
echo "✨ Test Summary:"
echo "==============="
echo "✅ Cluster running: ${CLUSTER_NAME}"
echo "✅ Namespace: ${NAMESPACE}"
echo "✅ Release: ${RELEASE_NAME}"
echo "✅ Pods deployed and probes configured"
echo

echo "🔧 Useful commands:"
echo "==================="
echo "Watch pod status:     kubectl get pods -n ${NAMESPACE} -w"
echo "Watch events:         kubectl get events -n ${NAMESPACE} -w"
echo "Describe frontend:    kubectl describe pod ${FRONTEND_POD} -n ${NAMESPACE}"
echo "Describe backend:     kubectl describe pod ${BACKEND_POD} -n ${NAMESPACE}"
echo "Frontend logs:        kubectl logs ${FRONTEND_POD} -n ${NAMESPACE} -f"
echo "Backend logs:         kubectl logs ${BACKEND_POD} -n ${NAMESPACE} -f"
echo "Port forward frontend: kubectl port-forward -n ${NAMESPACE} ${FRONTEND_POD} 8080:80"
echo "Port forward backend:  kubectl port-forward -n ${NAMESPACE} ${BACKEND_POD} 3003:3003"
echo

echo "🧹 Cleanup:"
echo "==========="
echo "Delete release:       helm uninstall ${RELEASE_NAME} -n ${NAMESPACE}"
echo "Delete cluster:       kind delete cluster --name ${CLUSTER_NAME}"
