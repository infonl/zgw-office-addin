# ZGW Office Add-in - Development Context

This file contains important context information for development work on the ZGW Office Add-in project.

## Project Overview

**Name**: ZGW Office Add-in  
**Type**: Microsoft Office Add-in for integration with Dimpact's PodiumD  
**License**: EUPL-1.2+  
**Repository**: https://github.com/infonl/zgw-office-addin  

### Description
Microsoft Office add-in designed to integrate with Dimpact's PodiumD platform. The add-in enables seamless interaction between Microsoft Office applications (primarily Word) and PodiumD services, enhancing productivity and streamlining workflows for municipal document management.

## Architecture

This is a **monorepo** using npm workspaces with two main components:

### Frontend (`office-add-in/`)
- **Technology**: TypeScript, React, Office.js API, Fluent UI
- **Build Tool**: Webpack
- **Port**: 3000 (HTTPS required)
- **Target**: Microsoft Word integration
- **Key Dependencies**: 
  - React 18.3.1
  - @fluentui/react-components
  - @tanstack/react-query
  - office.js types

### Backend (`office-backend/`)
- **Technology**: TypeScript, Fastify
- **Port**: 3003
- **Key Dependencies**:
  - Fastify 5.4.0
  - JWT authentication
  - dotenv for configuration

### Infrastructure
- **Container Registry**: ghcr.io/infonl/
- **Development**: Docker Compose with local SSL certificates
- **External Services**: 
  - OpenZaak (ZGW API)
  - Objecten API
  - PostgreSQL database
  - Redis cache

## Development Environment

### Prerequisites
- **Node.js**: 22.21.1 (see `.nvmrc`)
- **npm**: 11.6.2 (specified in `packageManager` field in package.json)
- **mkcert**: For SSL certificate generation
- **Microsoft Office**: Desktop version for local testing
- **Docker**: For containerized development

### Key Development Commands
```bash
# Root level - monorepo management
npm install                 # Install all dependencies
npm run dev                 # Start development servers (with type generation)
npm run build              # Build all workspaces (with type generation)
npm run lint               # Lint all code (with type generation)
npm run check              # Full validation (types + lint + prettier + validate + test)
npm run types              # Generate OpenAPI types from ZRC spec

# Testing
npm run test               # Run all tests via Vitest
npm run test:coverage      # Run tests with coverage reports
npm run test:ui            # Run tests with interactive UI

# Code quality
npm run prettier           # Check code formatting
npm run prettier:fix       # Fix code formatting issues
npm run lint:fix           # Auto-fix linting issues
npm run validate           # Run validation checks

# Cleanup
npm run clean              # Clean build files (interactive)
npm run clean:deep         # Deep clean (build files + node_modules)

# SSL Certificate setup (required for Office Add-ins)
./generate-keys.sh         # Generate local SSL certificates
mkcert -install           # Install local CA (one-time)

# Docker development
docker-compose up -d       # Start all services
docker-compose down        # Stop all services
npm run docker:build      # Build Docker images
```

### SSL Certificate Requirements
⚠️ **CRITICAL**: Office Add-ins MUST use HTTPS in all environments

- Uses `mkcert` for trusted local certificates
- Certificates generated for localhost, 127.0.0.1, ::1
- Auto-mounted in Docker containers
- Required for Office Add-in loading and authentication

### Build System
- **Orchestration**: Turborepo 2.6.1 (configured in `turbo.json`)
- **Package Manager**: npm workspaces
- **Key Scripts**: All managed through Turborepo tasks
- **Type Generation**: OpenAPI to TypeScript via `openapi-typescript`
- **Testing Framework**: Vitest 4.0.8 with happy-dom
- **Coverage**: V8 provider with multiple reporters (text, json, html, lcov)

### Turborepo Task Configuration
The monorepo uses Turborepo for efficient task orchestration with the following tasks:
- **build**: Builds all packages with dependencies (`^build`)
- **dev**: Runs development servers (persistent, no cache)
- **lint**: Lints code with dependency builds
- **test**: Runs tests with coverage output
- **docker:build**: Builds Docker images (depends on build)
- **prettier**: Code formatting checks
- **validate**: Validation checks (no cache)
- **clean/clean:deep**: Cleanup tasks (no cache)

### Docker Services (docker-compose.yml)
- **frontend**: Nginx proxy (port 3000, HTTPS)
- **backend**: API server (port 3003)
- **openzaak.local**: ZGW API service (port 8020)
- **openzaak-database**: PostgreSQL (port 15432)
- **redis**: Cache service

## Development Workflow

### Local Development (Recommended)
1. Generate SSL certificates: `./generate-keys.sh`
2. Install dependencies: `npm install`
3. Start backend: `cd office-backend && npm run dev`
4. Start add-in: `npm run start` (opens Word with add-in)

### Docker Development
1. Build containers: `npm run docker:build`
2. Start services: `docker-compose up -d`
3. Access frontend: https://localhost:3000

### Testing & Sideloading
- Add-in automatically loads in Word via `npm run start`
- Uses Office.js debugging tools
- Supports hot reloading in development

## Code Quality & Standards

### Linting & Formatting
- **ESLint**: Configured with Office Add-in specific rules
- **Prettier**: Consistent code formatting
- **TypeScript**: Strict mode enabled
- **Office Add-in Rules**: Special ESLint plugin for Office.js compliance

### Testing
- **Test Framework**: Vitest 4.0.8 with TypeScript support
- **Test Environment**: Node.js with happy-dom for DOM testing
- **Coverage**: V8 provider with comprehensive reporting
- **Testing Library**: @testing-library/react for component testing
- **Coverage Reports**: Generated in `./coverage` directory
- **Exclusions**: node_modules, dist, build, config files, test files

### CI/CD Integration
- GitHub Actions workflows (in `.github/`)
- Automated testing and validation
- Docker image building and publishing
- Code quality checks on PRs

## Key Files & Directories

### Configuration Files
- `package.json` - Root monorepo configuration
- `turbo.json` - Build orchestration
- `.nvmrc` - Node.js version specification
- `docker-compose.yml` - Local development services
- `openapitools.json` - API type generation

### Documentation
- `docs/development/README.md` - Detailed setup instructions
- `docs/architecture/contextDiagram.md` - System architecture
- `DIRECT-BROWSER-TESTING.md` - Browser testing guide
- `LOCAL-TESTING.md` - Local testing procedures

### Generated Files
- `generated/types.ts` - OpenAPI generated types
- `office-add-in/ssl-certs/` - Local SSL certificates
- `office-backend/ssl-certs/` - Backend SSL certificates

## Important Notes for Development

### Office Add-in Specific
- **Manifest**: `office-add-in/manifest.xml` defines add-in capabilities
- **Target Application**: Primarily Microsoft Word
- **API Integration**: Uses Office.js for Word interaction
- **Security**: HTTPS required, CSP headers important

### ZGW Integration
- Connects to ZGW (Zaakgericht Werken) APIs
- Municipal document management workflows
- Authentication via JWT tokens
- OpenAPI specs drive type generation

### Troubleshooting Common Issues
1. **Certificate Errors**: Ensure `mkcert -install` has been run
2. **Add-in Won't Load**: Check HTTPS certificates and manifest validity
3. **Build Failures**: Verify Node.js version matches `.nvmrc`
4. **Type Errors**: Run `npm run types` to regenerate OpenAPI types

## Git Workflow Considerations
- Monorepo structure with workspace dependencies
- Root-level scripts manage all workspaces
- Docker images built from monorepo context
- Generated files should be gitignored (check `.gitignore`)

## Useful Documentation Links

### Microsoft Office Add-in Development
- [Office Add-ins Platform Overview](https://docs.microsoft.com/en-us/office/dev/add-ins/overview/office-add-ins)
- [Office Add-ins Documentation](https://docs.microsoft.com/en-us/office/dev/add-ins/)
- [Office.js API Reference](https://docs.microsoft.com/en-us/javascript/api/office?view=common-js)
- [Word JavaScript API Reference](https://docs.microsoft.com/en-us/javascript/api/word?view=word-js-preview)
- [Office Add-ins Requirements Set](https://docs.microsoft.com/en-us/office/dev/add-ins/reference/requirement-sets/office-add-in-requirement-sets)
- [Office-Addin-TaskPane Sample](https://github.com/OfficeDev/Office-Addin-TaskPane)

### React and Frontend Libraries
- [React Documentation](https://react.dev/)
- [Fluent UI React Documentation](https://react.fluentui.dev/)
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)

### Backend and Infrastructure
- [Fastify Documentation](https://www.fastify.io/docs/latest/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [JWT Documentation](https://jwt.io/introduction/)
- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)

### Development Tools
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [npm Workspaces Documentation](https://docs.npmjs.com/cli/v9/using-npm/workspaces)
- [Webpack Documentation](https://webpack.js.org/concepts/)
- [ESLint Documentation](https://eslint.org/docs/user-guide/getting-started)
- [Prettier Documentation](https://prettier.io/docs/en/index.html)
- [mkcert Documentation](https://github.com/FiloSottile/mkcert)

### ZGW Standards and APIs
- [ZGW API Standards (Dutch)](https://vng-realisatie.github.io/gemma-zaken/)
- [OpenZaak Documentation](https://open-zaak.readthedocs.io/)
- [Objecten API Documentation](https://objects-and-objecttypes-api.readthedocs.io/)

---

*This context file should be updated when significant architectural or workflow changes are made to the project.*
