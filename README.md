# ZGW Office Addin

Microsoft Office add-in for integration with Dimpact's PodiumD.

## Project Description

This monorepo contains a Microsoft Office add-in designed to integrate with Dimpact's PodiumD platform. The add-in enables seamless interaction between Microsoft Office applications (primarily Word) and PodiumD services, enhancing productivity and streamlining workflows for municipal document management.

## Project Structure

The project is organized as a monorepo using npm workspaces:

- **office-add-in**: Front-end Office add-in component
  - Built with TypeScript and Office JS API
  - Provides the UI and interaction within Office applications
  - Configured for Word integration by default

- **office-backend**: Backend service component
  - Provides API endpoints for the add-in
  - Built with TypeScript and Fastify

## Build Tools and Requirements

This project uses the following build tools and technologies:

- **Turborepo**: For build orchestration and monorepo management
- **npm**: Package manager (version managed via Node.js installation)
- **TypeScript**: For type-safe JavaScript development
- **Webpack**: For bundling the Office add-in
- **Fastify**: For the backend API server

## Development Setup

More details on the development setup can be found in the [development setup documentation](docs/development/README.md).

### Prerequisites

- **Node.js**: Use the version specified in `.nvmrc`
  ```bash
  # Install and use the correct Node.js version with nvm
  nvm install
  nvm use
  ```
- **npm**: Comes bundled with Node.js, (version is specified in `packageManager` field)

  ```bash
  # Check npm version
  npm --version

  # Update npm if needed
  npm install -g npm@latest
  ```

- **Microsoft Office**: Desktop version for local testing

## License

This project is licensed under the EUPL-1.2-or-later - see the [LICENSE](LICENSE.md) file for details.

## OpenAPI Types & TypeScript

This repository uses automatically generated TypeScript types from the backend OpenAPI specifications.

### Using ApiType

The generic `ApiType` type from `generated/api-type.ts` allows to directly retrieve a schema type from any OpenAPI spec:

```typescript
import { ApiType } from "./generated/api-type";

// For the DRC API:
type MyDRCSchema = ApiType<
  "SchemaName",
  import("./generated/drc-types").components
>;
```

### More information

- See the files in `generated/` for all available types.
- Types are automatically regenerated when the OpenAPI specs are updated.

## MSAL Environment Variables for local Graph authentication

Microsoft Office API cannot generate a valid authentication token for `localhost` due to Microsoft security restrictions. As a result, local development requires a fallback to MSAL (Microsoft Authentication Library) for Graph authentication.

- The authentication provider automatically falls back to MSAL when running locally (`APP_ENV=local`).
- MSAL requires explicit environment variables to be set for authentication to work in local development.

### Required MSAL Environment Variables

Set these variables in your `.env.local.frontend` file :

- `APP_ENV=local`
- `MSAL_CLIENT_ID`: Azure AD Application (client) ID
- `MSAL_AUTHORITY`: Authority URL (e.g. `https://login.microsoftonline.com/<tenant-id>`)
- `MSAL_REDIRECT_URI`: Redirect URI for your app (e.g. `https://localhost:3000/auth-callback`)
- `MSAL_SCOPES`: api://localhost:3000/<client-id>/access_as_user


### Notes

- These variables are required for all local development environments (Docker, Webpack, etc).
- The fallback logic is implemented in `OfficeGraphAuthProvider.ts`.
- For production, authentication uses Office SSO and does not require these MSAL variables.

