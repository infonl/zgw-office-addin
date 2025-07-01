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
- **npm**: Package manager (requires version 10.9.2 or higher)
- **TypeScript**: For type-safe JavaScript development
- **Webpack**: For bundling the Office add-in
- **Fastify**: For the backend API server

## Development Setup
More details on the development setup can be found in the [development setup documentation](docs/development/README.md).

### Prerequisites

- Node.js (per version in `.nvmrc`)
- Microsoft Office (desktop version for local testing)


## License

This project is licensed under the EUPL-1.2-or-later - see the [LICENSE](LICENSE.md) file for details.
