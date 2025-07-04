# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2025-01-04

### Changed
- Updated README.md with comprehensive project documentation
- Added project badges for better visibility
- Improved installation and setup instructions
- Enhanced GitFlow workflow documentation
- Added detailed roadmap for future versions

### Added
- MIT License file
- Better project structure explanation
- Contributing guidelines
- Support section with helpful links

## [1.0.0] - 2025-01-04

### Added
- Initial release of CAS/DISOT Angular application
- Content Addressable Storage (CAS) implementation with SHA-256 hashing
- DISOT (Decentralized Immutable Source of Truth) with digital signatures
- Angular 18 standalone components architecture
- Core services:
  - CAS Service for content storage and retrieval
  - DISOT Service for entry management
  - Hash Service using Web Crypto API
  - Signature Service (mock implementation for development)
  - Local Storage Service for in-memory persistence
- UI Components:
  - Content Upload component for file uploads
  - Content List component with search and preview
  - DISOT Entry component for creating signed entries
  - Signature Verification component for entry validation
- Comprehensive test suite (74 tests, all passing)
- Full technical documentation with Mermaid diagrams
- Clean Architecture with SOLID principles
- Responsive design with mobile support

### Security
- Content integrity via SHA-256 hashing
- Digital signature support (mock implementation)
- Input validation and sanitization

### Known Issues
- Signature Service uses mock implementation (real secp256k1 needed for production)
- Storage is in-memory only (no persistence between sessions)
- No authentication or authorization system

### Technical Stack
- Angular 18.2.0
- TypeScript 5.5.2
- Karma/Jasmine for testing
- Web Crypto API for cryptography
- Standalone components architecture

[1.0.1]: https://github.com/o2alexanderfedin/angular-cas-disot/releases/tag/v1.0.1
[1.0.0]: https://github.com/o2alexanderfedin/angular-cas-disot/releases/tag/v1.0.0