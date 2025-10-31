# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

# This script generates localhost SSL certificates using mkcert for the frontend.
# mkcert creates certificates that are trusted by browsers and system tools.

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null; then
    echo "❌ mkcert is not installed. Please install it first:"
    echo "   brew install mkcert"
    exit 1
fi

# Re-create ssl-certs directories
rm -rf ./office-add-in/ssl-certs
mkdir -p ./office-add-in/ssl-certs

echo "🔧 Generating localhost SSL certificates with mkcert..."

# === FRONTEND CERTIFICATES ===
echo "📱 Generating frontend certificates..."
cd ./office-add-in/ssl-certs
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1
cd ../..

# Copy the mkcert CA certificate
echo "📋 Copying CA certificate..."
MKCERT_CA_ROOT=$(mkcert -CAROOT)
cp "$MKCERT_CA_ROOT/rootCA.pem" ./office-add-in/ssl-certs/ca-cert.pem

echo "✅ Certificate generation complete!"
echo "📁 Frontend certificates: ./office-add-in/ssl-certs/"
echo ""
echo "🔒 To trust these certificates system-wide, run:"
echo "   mkcert -install"
echo ""
echo "🐳 Your Docker Compose setup will automatically use these certificates!"
