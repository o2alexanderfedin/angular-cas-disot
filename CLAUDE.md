# CAS Angular Application - Development Guide

## Project Overview
This is a decentralized content management system implementing Content Addressable Storage (CAS) and DISOT (Decentralized Immutable Source of Truth) using Angular framework.

## Development Commands
- `npm test` - Run all unit tests in headless mode
- `npm start` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint (if configured)
- `npm run typecheck` - Run TypeScript type checking (if configured)

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

## Storage Providers
- **InMemoryStorageService** - Default, data lost on refresh
- **IndexedDbStorageService** - Persistent browser storage
- Configurable via Settings page

## Testing
- TDD approach used throughout
- Run tests with `npm test`
- All tests run in ChromeHeadless mode
- Current status: 108/108 tests passing ✅

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

## Important Notes
1. **Cryptography**: The SignatureService uses a mock implementation. For production, replace with proper secp256k1 library.
2. **Storage**: IndexedDB storage is now implemented for persistence.
3. **Node Version**: Project shows warnings with Node v23.x but works correctly.

## Recent Updates (v1.1.0)
1. ✅ IndexedDB storage implementation
2. ✅ Enhanced content preview with type detection
3. ✅ Modal content selection with preview
4. ✅ Blog post creation in DISOT entries
5. ✅ Previous entry preview functionality
6. ✅ Storage provider selection at runtime