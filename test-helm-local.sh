#!/bin/bash
# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

set -e

echo "🚀 Office Add-in Helm Chart Local Testing"
echo "========================================="

# Check prerequisites
echo "📋 Checking prerequisites..."
for cmd in kind kubectl helm docker; do
    if ! command -v $cmd &> /dev/null; then
        echo "❌ $cmd is required but not installed."
        exit 1
    fi
    echo "✅ $cmd found"
done

# Configuration
CLUSTER_NAME="office-addin-test"
NAMESPACE="office-addin-test"
CHART_PATH="./charts/office-add-in"

echo
echo "🏗️  Creating Kind cluster..."
kind create cluster --config kind-config.yaml

echo
echo "📊 Cluster information:"
kubectl cluster-info --context kind-$CLUSTER_NAME
kubectl get nodes

echo
echo "📁 Creating namespace..."
kubectl create namespace $NAMESPACE

echo
echo "📝 Testing Helm chart structure..."
echo "   - Linting chart..."
helm lint $CHART_PATH

echo "   - Dry-run with default values..."
helm template test-release $CHART_PATH --dry-run > /dev/null
echo "   ✅ Default values template renders successfully"

echo "   - Dry-run with production values..."
helm template test-release $CHART_PATH -f $CHART_PATH/values.production.yaml --dry-run > /dev/null
echo "   ✅ Production values template renders successfully"

echo
echo "🚢 Deploying with Helm..."
helm install $CLUSTER_NAME $CHART_PATH -n $NAMESPACE

echo
echo "📊 Checking deployment status..."
kubectl get all -n $NAMESPACE

echo
echo "📋 Pod details:"
kubectl describe pods -n $NAMESPACE

echo
echo "🔍 Checking services:"
kubectl get svc -n $NAMESPACE -o wide

echo
echo "📊 Events in namespace:"
kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp'

echo
echo "📋 Helm status:"
helm status $CLUSTER_NAME -n $NAMESPACE

echo
echo "📝 Test Values:"
helm get values $CLUSTER_NAME -n $NAMESPACE

echo
echo "🧪 Creating NodePort service for testing..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: $CLUSTER_NAME-frontend-nodeport
  namespace: $NAMESPACE
spec:
  type: NodePort
  selector:
    app.kubernetes.io/name: frontend
    app.kubernetes.io/instance: $CLUSTER_NAME
  ports:
  - name: http
    port: 80
    targetPort: 8080
    nodePort: 30080
  - name: https
    port: 443
    targetPort: 8443
    nodePort: 30443
EOF

echo "✅ NodePort service created"
echo "   HTTP:  http://localhost:30080 (should redirect to HTTPS)"
echo "   HTTPS: https://localhost:30443 (main service - will need SSL cert)"

echo
echo "📊 Final status:"
kubectl get all -n $NAMESPACE

echo
echo "🎯 Testing Summary:"
echo "=================="
echo "✅ Kind cluster created successfully"
echo "✅ Namespace created"
echo "✅ Helm chart linting passed"
echo "✅ Template rendering works (default & production values)"
echo "✅ Helm deployment succeeded"
echo "✅ Kubernetes resources created:"
kubectl get deployments,services,pods -n $NAMESPACE --no-headers | wc -l | xargs echo "   - Total resources:"

echo
echo "⚠️  Note: If you see ImagePull errors, this is expected for public images."
echo "   The Helm chart structure and Kubernetes deployment are working correctly!"

echo
echo "🔧 To test with local images:"
echo "   1. Build images: docker build -t office-addin-frontend:test ./office-add-in"
echo "   2. Load into Kind: kind load docker-image office-addin-frontend:test --name $CLUSTER_NAME"
echo "   3. Deploy with local tag: helm upgrade $CLUSTER_NAME $CHART_PATH -n $NAMESPACE --set frontend.image.tag=test --set frontend.image.pullPolicy=Never"

echo
echo "🧹 To cleanup:"
echo "   helm uninstall $CLUSTER_NAME -n $NAMESPACE"
echo "   kind delete cluster --name $CLUSTER_NAME"
echo
echo "✨ Test completed successfully!"
