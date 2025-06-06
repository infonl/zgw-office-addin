# SPDX-FileCopyrightText: 2025 INFO.nl
# SPDX-License-Identifier: EUPL-1.2+

# This script generates a self-signed CA and server certificate for the office backend.

# Generate an unencrypted CA private key
openssl genrsa -out ./office-backend/ca-key.pem 4096

# Generate the CA certificate
openssl req -new -x509 -days 9999 -config ./server.example.cnf -key ./office-backend/ca-key.pem -out ./office-backend/ca-cert.pem

# Generate an unencrypted server private key
openssl genrsa -out ./office-backend/key.pem 4096

# Generate the server certificate signing request (CSR)
openssl req -new -config ./server.example.cnf -key ./office-backend/key.pem -out ./office-backend/csr.pem

# Generate the server certificate signed by the CA
openssl x509 -req -extfile ./server.example.cnf -extensions v3_req -days 999 -in ./office-backend/csr.pem -CA ./office-backend/ca-cert.pem -CAkey ./office-backend/ca-key.pem -CAcreateserial -out ./office-backend/cert.pem
