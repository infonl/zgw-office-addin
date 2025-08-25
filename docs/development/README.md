## Development Setup

### Prerequisites

- mkcert (for generating local SSL certificates)
- Node.js (per version in `.nvmrc`)
- Microsoft Office (desktop version for local testing)

### Installation

1. Clone the repository
   ```shell
   git clone https://github.com/infonl/zgw-office-addin/
   cd zgw-office-addin
   ```

2. Install dependencies
   ```shell
   npm install
   ```
3. Install mkcert and create a local CA (if not already done)
   ```shell
   brew install mkcert
   mkcert -install
   ```

## SSL Certificates for Local Development

### Why SSL Certificates are Required

Office Add-ins **must** use HTTPS in production and development environments. Microsoft Office requires secure connections for:
- Loading the add-in manifest
- Communication between Office and the add-in
- API calls and authentication flows

Without proper SSL certificates, you'll encounter:
- ❌ Certificate verification errors
- ❌ Browser security warnings
- ❌ Office Add-in loading failures
- ❌ Authentication issues

### Using mkcert for Development

[mkcert](https://github.com/FiloSottile/mkcert) is a simple tool for making locally-trusted development certificates. It automatically creates and installs a local Certificate Authority (CA) in the system trust store, and generates locally-trusted certificates.

#### Why mkcert?

✅ **Trusted by browsers** - No security warnings  
✅ **Works with Office Add-ins** - Microsoft Office trusts the certificates  
✅ **Easy to use** - Simple commands, no configuration files  
✅ **Cross-platform** - Works on macOS, Linux, and Windows  
✅ **Docker-friendly** - Certificates work in containers  
✅ **Long validity** - 3+ year certificates  

### Installation and Setup

1. **Install mkcert**
   ```shell
   # macOS
   brew install mkcert
   
   # Linux
   curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/amd64"
   chmod +x mkcert-v*-linux-amd64
   sudo mv mkcert-v*-linux-amd64 /usr/local/bin/mkcert
   
   # Windows
   choco install mkcert
   ```

2. **Install the local CA** (one-time setup)
   ```shell
   mkcert -install
   ```
   This installs mkcert's root certificate in your system trust store.

3. **Generate certificates for the project**
   ```shell
   ./generate-keys.sh
   ```

### What the generate-keys.sh Script Does

The `generate-keys.sh` script automatically:
1. Creates SSL certificate directories for both frontend and backend
2. Generates localhost certificates using mkcert for:
   - `localhost`
   - `127.0.0.1` 
   - `::1` (IPv6 localhost)
3. Copies the CA certificate to both directories
4. Sets up certificates ready for Docker Compose

#### Generated Certificate Files

After running the script, you'll have:

```
office-add-in/ssl-certs/
├── cert.pem      # Server certificate
├── key.pem       # Private key
└── ca-cert.pem   # Certificate Authority certificate

office-backend/ssl-certs/
├── cert.pem      # Server certificate  
├── key.pem       # Private key
└── ca-cert.pem   # Certificate Authority certificate
```

### Troubleshooting Certificate Issues

**Problem:** Browser shows "NET::ERR_CERT_AUTHORITY_INVALID"
**Solution:** Run `mkcert -install` to trust the local CA

**Problem:** Office Add-in won't load
**Solution:** Ensure certificates are generated and `mkcert -install` has been run

**Problem:** Docker containers can't access certificates
**Solution:** Certificates are mounted from host - ensure `./generate-keys.sh` has been run

**Problem:** Certificates expired
**Solution:** Re-run `./generate-keys.sh` to generate new certificates

#### Alternative: Manual Certificate Trust (Not Recommended)

If you cannot use `mkcert -install` (e.g., in restricted environments), you can manually trust certificates:

##### macOS Manual Trust
1. Open **Keychain Access**
2. File → Import Items → Select `ca-cert.pem`
3. Double-click the imported certificate
4. Expand "Trust" section
5. Set "When using this certificate" to **"Always Trust"**

##### Windows Manual Trust
1. Open `ca-cert.pem` in Windows
2. Click "Install Certificate"
3. Choose "Local Machine" → Next
4. Select "Place all certificates in the following store"
5. Browse → Select "Trusted Root Certification Authorities"

### Docker Compose Integration

The project's `docker-compose.yml` automatically mounts SSL certificates:

```yaml
frontend:
  volumes:
    - ./office-add-in/ssl-certs:/etc/nginx/certs:ro
```

This means:
- 📁 Certificates generated on your host machine
- 🐳 Automatically available in Docker containers  
- 🔄 Persistent across container rebuilds
- 🔒 No certificate generation needed inside containers

## Testing

### Start the Office Backend

From within the `office-backend` directory, start the backend service:
```shell
  npm run dev
```

### Sideloading the Add-in in Word Application
For more detailed instructions on sideloading the add-in, see the [official documentation](https://docs.microsoft.com/en-us/office/dev/add-ins/testing/sideload-office-add-ins-for-testing).

To test the add-in in the Word Application, start the add-in, and it will open the application with the add-in loaded:
```shell
  npm run start
```

You can edit your source files, and see the changes reflected in the Word Application immediately.

## Docker Compose

We use Docker to create containers for the frontend and backend.

To create and start the containers, run the following commands in the root of the project:

- `docker-compose build`: Builds the docker images
- `docker-compose up -d`: Starts the containers in detached mode

To delete the containers run
- `docker-compose down`: Deletes the docker containers

## Common Commands

```shell
# Generate/regenerate SSL certificates
./generate-keys.sh

# Start development (local)
npm run dev

# Start development (Docker)
docker-compose up -d

# View certificate details
openssl x509 -in office-add-in/ssl-certs/cert.pem -noout -dates -subject

# Check if mkcert CA is installed
mkcert -CAROOT
```

## Useful Links

- [mkcert Documentation](https://github.com/FiloSottile/mkcert)
- [Office Add-ins HTTPS Requirements](https://docs.microsoft.com/en-us/office/dev/add-ins/concepts/add-in-development-best-practices#use-https)
- [Sideloading Office Add-ins](https://docs.microsoft.com/en-us/office/dev/add-ins/testing/sideload-office-add-ins-for-testing)
