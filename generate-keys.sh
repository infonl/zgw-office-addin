openssl req -new -x509 -days 9999 -config ./ca.example.cnf -keyout ./office-backend/ca-key.pem -out ./office-backend/ca-cert.pem
openssl genrsa -out ./office-backend/key.pem 4096
openssl req -new -config ./server.example.cnf -key ./office-backend/key.pem -out ./office-backend/csr.pem
openssl x509 -req -extfile ./server.example.cnf -days 999 -passin "pass:password" -in ./office-backend/csr.pem -CA ./office-backend/ca-cert.pem -CAkey ./office-backend/ca-key.pem -CAcreateserial -out ./office-backend/cert.pem
