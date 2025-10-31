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
   Before executing fill in the path to the project in the `generate-keys-backend.sh`
   ```shell
   ./generate-keys-frontend.sh
   ./generate-keys-backend.sh
   ```

### What both the generate-keys.sh Script Do

Both the `generate-keys.sh` scripts automatically:
1. Creates SSL certificate directories for both frontend and backend
2. Generates localhost certificates using mkcert for:
   - `localhost`
   - `127.0.0.1` 
   - `::1` (IPv6 localhost)
3. Copies the CA certificate to both directories
4. Sets up certificates ready for Docker Compose
5. Trusts the backend scripts on your local machine

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
**Solution:** Certificates are mounted from host - ensure both `./generate-keys.sh` commands have been run

**Problem:** Certificates expired
**Solution:** Re-run both `./generate-keys.sh` scripts to generate new certificates

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


## Sideloading the Add-ins

### Word Add-in
For detailed instructions on sideloading the Word add-in, refer to the [official Microsoft documentation](https://docs.microsoft.com/en-us/office/dev/add-ins/testing/sideload-office-add-ins-for-testing).

**Start locally**
```shell
npm run start:office
```
This launches the local dev server and opens Microsoft Word with the add-in loaded. You can edit source files and see the changes immediately.

**Validate / sideload**
```shell
npm run validate:office
```
To sideload, upload the manifest: `manifest-office.xml` (or fetch it from `https://ontw-office-addin.dimpact.info.nl/manifest-office.xml`).

---

### Outlook Add-in (Mail)
You can sideload the Outlook add-in using the Outlook web or desktop client via [https://aka.ms/olksideload](https://aka.ms/olksideload). Upload the manifest file `manifest-outlook.xml`.

**Start locally**
```shell
npm run start:outlook
```
This starts the add-in for Outlook. Ensure your development environment uses valid HTTPS certificates generated with mkcert.

**Validate / sideload**
```shell
npm run validate:outlook
```

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
./generate-keys-frontend.sh
./generate-keys-backend.sh


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
