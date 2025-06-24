#!/bin/sh
set -e

# Check if GENERATE_SELF_SIGNED environment variable is set to true
if [ "$GENERATE_SELF_SIGNED" = "true" ]; then
  echo "Generating self-signed keys..."
  # Generate an unencrypted CA private key
  openssl genrsa -out ./ca-key.pem 4096

  # Generate the CA certificate
  openssl req -new -x509 -days 9999 -config ../server.example.cnf -key ./ca-key.pem -out ./ca-cert.pem

  # Generate an unencrypted server private key
  openssl genrsa -out ./key.pem 4096

  # Generate the server certificate signing request (CSR)
  openssl req -new -config ../server.example.cnf -key ./key.pem -out ./csr.pem

  # Generate the server certificate signed by the CA
  openssl x509 -req -extfile ../server.example.cnf -extensions v3_req -days 999 -in ./csr.pem -CA ./ca-cert.pem -CAkey ./ca-key.pem -CAcreateserial -out ./cert.pem
fi

# Start the Node.js application
echo "Starting the Node.js application..."
node dist/office-backend/src/app.js
