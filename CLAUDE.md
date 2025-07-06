# CAS Angular Application - Development Guide

## Project Overview
This is a decentralized content management system implementing Content Addressable Storage (CAS) and DISOT (Decentralized Immutable Source of Truth) using Angular framework.

## Development Commands
- `npm test` - Run all unit tests in headless mode
- `npm test:coverage` - Run tests with code coverage report
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run build:staging` - Build for staging environment
- `npm run build:production` - Build for production environment
- `npm run preview:staging` - Preview staging build locally
- `npm run preview:production` - Preview production build locally

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
5. **IndexedDbStorageService** - Persistent browser storage implementation
6. **CoverageService** - Code coverage data provider for display
7. **IPFSStorageService** - IPFS integration with local caching
8. **HeliaStorageService** - Browser-native IPFS using Helia
9. **IPFSShareLinkService** - Generate shareable IPFS gateway URLs
10. **IPFSMigrationService** - Migrate existing content to IPFS/Helia

## Storage Providers
- **InMemoryStorageService** - Default, data lost on refresh
- **IndexedDbStorageService** - Persistent browser storage
- **IPFSStorageService** - Distributed storage using IPFS network (requires local node)
- **HeliaStorageService** - Browser-native IPFS implementation
- Configurable via Settings page

## Testing
- TDD approach used throughout
- Run tests with `npm test`
- Run tests with coverage: `npm test:coverage`
- All tests run in ChromeHeadless mode
- Current status: 384/402 tests passing (18 failures in test setup)
- Code coverage: 78.08% statements, 82.23% functions

## Features
### Content Management
- Upload files with drag-and-drop
- Search content by hash
- Preview content in multiple formats (Text, JSON, Hex, Base64, Image)
- Auto-detect content types
- Download stored content

### DISOT Entries
- Create signed entries for content
- Support for BLOG_POST, DOCUMENT, IMAGE, SIGNATURE types
- Generate key pairs
- View previous entries with preview
- Verify entry signatures

### User Interface
- Modal content selection
- Responsive design
- Clean, modern UI
- Real-time search
- Loading states
- Dynamic code coverage display on home page

## Important Notes
1. **Cryptography**: The SignatureService uses a mock implementation. For production, replace with proper secp256k1 library.
2. **Storage**: Multiple storage providers available including IPFS and Helia for distributed storage.
3. **TypeScript**: Strict mode enabled with unused code detection (noUnusedLocals, noUnusedParameters)
4. **Deployment**: Staging deployment fixed with proper base-href and sequential deployment strategy
5. **IPFS**: For local IPFS node, configure CORS headers and use proxy in development
6. **Migration**: Content can be migrated from local storage to IPFS/Helia via the migration UI

## Recent Updates
### v3.0.0 - Phase 1 IPFS Integration (Latest)
1. ✅ Implemented IPFS storage provider with HTTP API client
2. ✅ Added Helia (browser-native IPFS) storage provider
3. ✅ Created hybrid storage with local caching
4. ✅ Implemented upload queue with persistence and retry logic
5. ✅ Added CID mapping service for content tracking
6. ✅ Created share link generation for IPFS gateway URLs
7. ✅ Built migration service for existing content
8. ✅ Enhanced settings UI with storage health indicators
9. ✅ Added migration UI for bulk content transfer
10. ✅ Comprehensive test coverage for all new features

### v2.5.0
1. ✅ Fixed staging deployment conflicts
2. ✅ Corrected base-href path for staging environment
3. ✅ Enabled TypeScript strict unused code detection
4. ✅ Cleaned up unused dependencies and code
5. ✅ Added dynamic code coverage display
6. ✅ Improved CI/CD pipeline with sequential deployments

### v1.1.0
1. ✅ IndexedDB storage implementation
2. ✅ Enhanced content preview with type detection
3. ✅ Modal content selection with preview
4. ✅ Blog post creation in DISOT entries
5. ✅ Previous entry preview functionality
6. ✅ Storage provider selection at runtime