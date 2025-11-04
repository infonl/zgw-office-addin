# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

# This script generates a self-signed CA and server certificate for the office backend.

mkdir -p ./office-backend/ssl-certs

# Generate an unencrypted CA private key
openssl genrsa -out ./office-backend/ssl-certs/ca-key.pem 4096

# Generate the CA certificate
openssl req -new -x509 -days 9999 -config ./server.example.cnf -key ./office-backend/ssl-certs/ca-key.pem -out ./office-backend/ssl-certs/ca-cert.pem

# Generate an unencrypted server private key
openssl genrsa -out ./office-backend/ssl-certs/key.pem 4096

# Generate the server certificate signing request (CSR)
openssl req -new -config ./server.example.cnf -key ./office-backend/ssl-certs/key.pem -out ./office-backend/ssl-certs/csr.pem

# Generate the server certificate signed by the CA
openssl x509 -req -extfile ./server.example.cnf -extensions v3_req -days 999 -in ./office-backend/ssl-certs/csr.pem -CA ./office-backend/ssl-certs/ca-cert.pem -CAkey ./office-backend/ssl-certs/ca-key.pem -CAcreateserial -out ./office-backend/ssl-certs/cert.pem

# The following command adds the CA certificate to the macOS system keychain.
# This step is only supported on macOS. It will be skipped on other platforms.
if [[ "$(uname)" == "Darwin" ]]; then
  security add-trusted-cert -d -r trustRoot -k ~/Library/Keychains/login.keychain-db {{RouteToProject}}/office-backend/ssl-certs/ca-cert.pem
else
  echo "Skipping 'security add-trusted-cert': this step is only supported on macOS."
fi