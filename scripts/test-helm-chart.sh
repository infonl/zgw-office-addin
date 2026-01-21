#!/bin/bash
# SPDX-FileCopyrightText: 2026 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

set -e

CLUSTER_NAME="chart-testing"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔍 Checking prerequisites..."

# Check if required tools are installed
if ! command -v kind &> /dev/null; then
    echo "❌ kind is not installed. Install with: brew install kind"
    exit 1
fi

if ! command -v helm &> /dev/null; then
    echo "❌ helm is not installed. Install with: brew install helm"
    exit 1
fi

if ! command -v ct &> /dev/null; then
    echo "❌ chart-testing is not installed. Install with: brew install chart-testing"
    exit 1
fi

echo "✅ All prerequisites met"
echo ""

cd "$PROJECT_ROOT"

# Build the project
echo "📦 Building project..."
npm install
npm run types
npm run build

# Build Docker images
echo "🐳 Building Docker images..."
npm run docker:build


# Check if cluster already exists
if kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "⚠️  Cluster '${CLUSTER_NAME}' already exists"
    read -p "Do you want to delete it and create a new one? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Deleting existing cluster..."
        kind delete cluster --name "$CLUSTER_NAME"
    else
        echo "ℹ️  Using existing cluster"
    fi
fi

# Create kind cluster if it doesn't exist
if ! kind get clusters | grep -q "^${CLUSTER_NAME}$"; then
    echo "🚀 Creating kind cluster..."
    kind create cluster --name "$CLUSTER_NAME"
fi

# Load images into kind
echo "📥 Loading images into kind cluster..."
kind load docker-image ghcr.io/infonl/zgw-office-add-in-frontend:dev --name "$CLUSTER_NAME"
kind load docker-image ghcr.io/infonl/zgw-office-add-in-backend:dev --name "$CLUSTER_NAME"

# Run chart-testing install
echo "🧪 Running chart-testing install..."
ct install --charts charts/office-add-in \
  --helm-extra-args "--values charts/office-add-in/values-test.yaml --set frontend.image.tag=dev --set frontend.image.pullPolicy=Never --set backend.image.tag=dev --set backend.image.pullPolicy=Never"

echo ""
echo "✅ Chart testing completed successfully!"
echo ""
echo "To inspect the cluster:"
echo "  kubectl get pods -A"
echo "  kubectl logs -l app.kubernetes.io/name=backend"
echo "  kubectl logs -l app.kubernetes.io/name=frontend"
echo ""
echo "To clean up:"
echo "  kind delete cluster --name $CLUSTER_NAME"
