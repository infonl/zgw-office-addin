## Development Setup

### Prerequisites

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

## Scripts and Commands

### Root Directory Commands

- `npm run dev`: Start all packages in development mode
- `npm run build`: Build all packages for production

#### Generating keys for development

In order to run the application, run the `generate-keys.sh` in the root directory.

Make sure to add trust the `cert.pem` and `ca-cert.pem` on your local machine.

##### MacOS
The keys should go under your `system keychain` and you should set the trust level to `Always Trust`.

### Office Add-in Commands

- `npm run dev`: Build in development mode
- `npm run dev-server`: Start webpack dev server
- `npm run build`: Build for production
- `npm run start`: Start the add-in in Office
- `npm run stop`: Stop the add-in
- `npm run validate`: Validate the add-in manifest
- `npm run lint`: Run linting checks
- `npm run lint:fix`: Fix linting issues

### Backend Commands

- `npm run dev`: Start in development mode with auto-reload
- `npm run start`: Start the server
- `npm run build`: Build for production

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
