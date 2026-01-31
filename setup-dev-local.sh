#!/bin/bash
# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

set -e

echo "🛠️  Setting up Local Development Environment with Kind"
echo "==================================================="

# Configuration
CLUSTER_NAME="office-addin-test"
NAMESPACE="office-addin-test"
CHART_PATH="./charts/office-add-in"
# Use the same image names and tags as the existing docker:build scripts
FRONTEND_IMAGE="ghcr.io/infonl/zgw-office-add-in-frontend"
BACKEND_IMAGE="ghcr.io/infonl/zgw-office-add-in-backend"
FRONTEND_TAG="dev"
BACKEND_TAG="dev"

# Parse command line arguments
BUILD_IMAGES=true

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-build)
            BUILD_IMAGES=false
            shift
            ;;
        *)
            echo "Unknown option $1"
            echo "Usage: $0 [--no-build]"
            exit 1
            ;;
    esac
done

# Check prerequisites
echo "📋 Checking prerequisites..."
for cmd in kind kubectl helm docker npm; do
    if ! command -v $cmd &> /dev/null; then
        echo "❌ $cmd is required but not installed."
        exit 1
    fi
    echo "✅ $cmd found"
done

# Build local images
if [ "$BUILD_IMAGES" = true ]; then
    echo
    echo "🏗️  Building local development images..."
    
    echo "  📦 Installing dependencies..."
    npm install
    
    echo "  🏭 Building project..."
    npm run build
    
    echo "  🐳 Building Docker images..."
    npm run docker:build
    
    echo "  ✅ Images built successfully"
else
    echo "ℹ️  Skipping image build (--no-build specified)"
fi

# Create Kind cluster with port mapping
echo
echo "🏗️  Creating Kind cluster with port mapping..."
if kind get clusters | grep -q "^$CLUSTER_NAME$"; then
    echo "ℹ️  Cluster $CLUSTER_NAME already exists"
else
    kind create cluster --config kind-config.yaml
fi

# Load images into Kind cluster
if [ "$BUILD_IMAGES" = true ]; then
    echo
    echo "📦 Loading images into Kind cluster..."
    
    echo "  🚚 Loading frontend image..."
    kind load docker-image "$FRONTEND_IMAGE:$FRONTEND_TAG" --name $CLUSTER_NAME
    
    echo "  🚚 Loading backend image..."
    kind load docker-image "$BACKEND_IMAGE:$BACKEND_TAG" --name $CLUSTER_NAME
    
    echo "  ✅ Images loaded into cluster"
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

# Deploy Office Add-in with local images
echo
echo "🚢 Deploying Office Add-in with local development images..."
helm upgrade --install office-addin-test $CHART_PATH \
    -n $NAMESPACE \
    -f $CHART_PATH/values.dev.yaml

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
echo "🎯 Local Development Setup Complete!"
echo "===================================="
echo
echo "🐳 Using Local Images:"
echo "   Frontend: $FRONTEND_IMAGE:$FRONTEND_TAG"
echo "   Backend:  $BACKEND_IMAGE:$BACKEND_TAG"
echo
echo "🌐 Access URLs:"
echo "   HTTP:  http://localhost:30080   (redirects to HTTPS)"
echo "   HTTPS: https://localhost:30443  (main service)"
echo
echo "🧪 Test Commands:"
echo "   curl -v http://localhost:30080/"
if command -v mkcert &> /dev/null && mkcert -CAROOT &>/dev/null; then
    echo "   curl https://localhost:30443/  # Should work without -k (trusted cert)"
else
    echo "   curl -k https://localhost:30443/"
fi
echo "   curl https://localhost:30443/manifest.xml"
echo "   curl https://localhost:30443/proxy/health"
echo
echo "📋 Browser Access:"
echo "   Open: https://localhost:30443"
if command -v mkcert &> /dev/null && mkcert -CAROOT &>/dev/null; then
    echo "   ✅ Certificate should be trusted (no warnings)"
else
    echo "   ⚠️  Accept certificate warning (run 'mkcert -install' for trusted certs)"
fi
echo
echo "🔄 Development Workflow:"
echo "   1. Make code changes"
echo "   2. Run: $0  (rebuilds and deploys)"
echo "   3. Test in browser at https://localhost:30443"
echo "   4. Repeat!"
echo
echo "🔧 Useful Commands:"
echo "   # View logs"
echo "   kubectl logs -l app.kubernetes.io/name=frontend -n $NAMESPACE --tail=50"
echo "   kubectl logs -l app.kubernetes.io/name=backend -n $NAMESPACE --tail=50"
echo
echo "   # Rebuild and redeploy"
echo "   $0  # Rebuilds images and redeploys"
echo
echo "   # Update without rebuilding"
echo "   $0 --no-build  # Skip Docker build step"
echo
echo "🧹 Cleanup Commands:"
echo "   helm uninstall office-addin-test -n $NAMESPACE"
echo "   kubectl delete namespace $NAMESPACE"
echo "   kind delete cluster --name $CLUSTER_NAME"
echo
echo "✨ Ready for local development!"
