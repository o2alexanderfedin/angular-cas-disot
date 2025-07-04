# CAS Angular Application - Development Guide

## Project Overview
This is a decentralized content management system implementing Content Addressable Storage (CAS) and DISOT (Decentralized Immutable Source of Truth) using Angular framework.

## Development Commands
- `npm test` - Run all unit tests in headless mode
- `npm start` - Start development server
- `npm run build` - Build for production

## Architecture
The application follows Clean Architecture principles with clear separation of concerns:

### Domain Layer (`src/app/core/domain/interfaces/`)
- Pure TypeScript interfaces defining business rules
- No external dependencies

### Application Services (`src/app/core/services/`)
- Business logic implementation
- All services are fully tested

### Key Services
1. **CasService** - Content storage using SHA-256 hashes
2. **DisotService** - Entry management with signatures
3. **SignatureService** - Currently mock implementation, needs production secp256k1
4. **HashService** - SHA-256 hashing via Web Crypto API

## Testing
- TDD approach used throughout
- Run tests with `npm test`
- All tests run in ChromeHeadless mode
- Current status: 30/30 tests passing

## Important Notes
1. **Cryptography**: The SignatureService uses a mock implementation. For production, replace with proper secp256k1 library.
2. **Storage**: Currently uses in-memory storage. Production should use persistent storage.
3. **Node Version**: Project shows warnings with Node v23.x but works correctly.

## Next Steps
1. Create Angular components for UI
2. Implement routing
3. Add styling and responsive design
4. Replace mock cryptography with real implementation
5. Add persistent storage