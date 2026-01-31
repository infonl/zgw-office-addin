#!/bin/bash
# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

set -e

echo "🌐 Setting up Direct Browser Access to Kind Cluster"
echo "=================================================="

# Configuration
CLUSTER_NAME="office-addin-test"
NAMESPACE="office-addin-test"
CHART_PATH="./charts/office-add-in"

# Check prerequisites
echo "📋 Checking prerequisites..."
for cmd in kind kubectl helm docker; do
    if ! command -v $cmd &> /dev/null; then
        echo "❌ $cmd is required but not installed."
        exit 1
    fi
    echo "✅ $cmd found"
done

# Create Kind cluster with port mapping
echo
echo "🏗️  Creating Kind cluster with port mapping..."
if kind get clusters | grep -q "^$CLUSTER_NAME$"; then
    echo "ℹ️  Cluster $CLUSTER_NAME already exists"
else
    kind create cluster --config kind-config.yaml
fi

# Create namespace
echo
echo "📁 Creating namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Generate SSL certificates using existing script
echo
echo "🔐 Generating SSL certificates..."
if [ ! -f "./office-add-in/ssl-certs/cert.pem" ]; then
    echo "Running generate-keys.sh to create trusted certificates..."
    ./generate-keys.sh
else
    echo "ℹ️  SSL certificates already exist"
fi

# Create SSL secret from generated certificates
echo
echo "🔑 Creating SSL secret in Kubernetes..."
kubectl create secret tls office-addin-tls \
    --key ./office-add-in/ssl-certs/key.pem \
    --cert ./office-add-in/ssl-certs/cert.pem \
    -n $NAMESPACE \
    --dry-run=client -o yaml | kubectl apply -f -

# Deploy Office Add-in with localhost URLs
echo
echo "🚢 Deploying Office Add-in..."
helm upgrade --install office-addin-test $CHART_PATH \
    -n $NAMESPACE \
    --set frontend.frontendUrl="https://localhost:30443"

# Create NodePort service
echo
echo "🌐 Creating NodePort service..."
cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: Service
metadata:
  name: office-addin-nodeport
  namespace: $NAMESPACE
spec:
  type: NodePort
  selector:
    app.kubernetes.io/name: frontend
    app.kubernetes.io/instance: office-addin-test
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

# Wait for pods to be ready
echo
echo "⏳ Waiting for pods to be ready..."
kubectl wait --for=condition=Ready pod -l app.kubernetes.io/instance=office-addin-test -n $NAMESPACE --timeout=300s || true

# Show deployment status
echo
echo "📊 Deployment status:"
kubectl get all -n $NAMESPACE

# Test connectivity
echo
echo "🧪 Testing connectivity..."
sleep 2

echo "  Testing HTTP redirect..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:30080/ || echo "failed")
if [ "$HTTP_STATUS" = "301" ]; then
    echo "  ✅ HTTP redirects to HTTPS (301)"
else
    echo "  ⚠️  HTTP redirect test failed (status: $HTTP_STATUS)"
fi

echo "  Testing HTTPS connection..."
HTTPS_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" https://localhost:30443/ || echo "failed")
if [ "$HTTPS_STATUS" = "200" ]; then
    echo "  ✅ HTTPS connection successful (200)"
else
    echo "  ⚠️  HTTPS connection test failed (status: $HTTPS_STATUS)"
fi

echo "  Testing manifest access..."
if curl -k -s https://localhost:30443/manifest.xml | grep -q "OfficeApp" 2>/dev/null; then
    echo "  ✅ Manifest accessible"
else
    echo "  ⚠️  Manifest test inconclusive (may need time to start)"
fi

echo
echo "🎯 Setup Complete!"
echo "=================="
echo
echo "🌐 Access URLs:"
echo "   HTTP:  http://localhost:30080   (redirects to HTTPS)"
echo "   HTTPS: https://localhost:30443  (main service)"
echo
echo "🧪 Test Commands:"
echo "   curl -v http://localhost:30080/"
echo "   curl https://localhost:30443/  # Should work without -k if mkcert is installed"
echo "   curl https://localhost:30443/manifest.xml"
echo "   curl https://localhost:30443/proxy/health"
echo
echo "📋 Browser Access:"
echo "   1. Open: https://localhost:30443"
if command -v mkcert &> /dev/null && mkcert -CAROOT &>/dev/null; then
    echo "   2. ✅ Certificate should be trusted (mkcert installed)"
else
    echo "   2. ⚠️  Accept certificate warning (run 'mkcert -install' for trusted certs)"
fi
echo "   3. You should see the Office Add-in interface"
echo
echo "🔧 Troubleshooting:"
echo "   - Check pods: kubectl get pods -n $NAMESPACE"
echo "   - View frontend logs: kubectl logs -l app.kubernetes.io/name=frontend -n $NAMESPACE"
echo "   - View backend logs: kubectl logs -l app.kubernetes.io/name=backend -n $NAMESPACE"
echo "   - Check port mappings: docker ps | grep office-addin-test"
echo
echo "🧹 Cleanup Commands:"
echo "   helm uninstall office-addin-test -n $NAMESPACE"
echo "   kubectl delete namespace $NAMESPACE"
echo "   kind delete cluster --name $CLUSTER_NAME"
echo
echo "✨ Ready for browser testing!"
