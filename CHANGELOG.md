# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.1] - 2025-07-06

### Fixed
- Fixed race condition in IPFSMigrationService progress tracking by reading current progress atomically
- Resolved Helia storage service test issues including duplicate spy setups and method name mismatches
- Fixed IPFS storage service test expectations to match actual error message formats
- Fixed migration component test DOM structure expectations
- Fixed storage settings component router dependency issues
- Increased bundle size budget from 1MB to 2MB to accommodate Helia dependencies

### Changed
- All 402 tests now passing (previously 384/402)
- Improved code coverage to 78.08% statements, 82.23% functions, 65.28% branches

## [3.0.0] - 2025-07-06

### Added
- **IPFS Storage Provider**: Distributed storage using external IPFS node with HTTP API
- **Helia Storage Provider**: Browser-native IPFS implementation using IndexedDB
- **Content Migration Service**: Migrate existing content from local storage to IPFS/Helia
- **Share Link Generation**: Generate shareable IPFS gateway URLs for content
- **Upload Queue**: Persistent queue with retry logic for IPFS uploads
- **CID Mapping Service**: Track content addresses across storage providers
- **Health Monitoring**: Real-time IPFS node health status indicators
- **Migration UI**: User interface for bulk content transfer with progress tracking
- **Hybrid Storage**: Local caching with distributed IPFS backend
- **IPFS Configuration**: Support for both API and gateway modes
- **Proxy Configuration**: Development proxy for IPFS API CORS bypass

### Changed
- Enhanced storage settings UI with provider-specific health indicators
- Updated storage provider factory to support new IPFS providers
- Increased test count from 108 to 402 tests
- Improved overall architecture for distributed storage support

## [2.5.1] - 2024

### Added
- Comprehensive documentation update
- Browser storage and security documentation
- Code cleanup guide integration
- Enhanced developer guide structure

## [2.5.0] - 2024

### Fixed
- Fixed staging deployment conflicts with sequential deployment strategy
- Corrected base-href path for staging environment

### Added
- TypeScript strict mode with unused code detection
- Dynamic code coverage display on home page
- Improved CI/CD pipeline with sequential deployments

### Removed
- Unused dependencies and code

## [2.4.0] - 2024

### Added
- CoverageService for displaying test coverage data
- Improved build scripts

### Removed
- Unused code and dependencies

## [2.0.0] - 2024

### Added
- Complete documentation restructuring
- Numbered, audience-based folder organization
- Separated current docs from future roadmap
- User guides and deployment documentation
- Fixed all 390 cross-references and navigation links
- Comprehensive changelog and resources sections

## [1.2.0] - 2024

### Added
- Phase 1 IPFS Integration Architecture documented
- Detailed implementation guide with code examples
- Story point-based roadmap for AI development
- Security and performance considerations
- Deployment architecture for development and production

## [1.1.4] - 2024

### Added
- Consistent navigation emojis across all documentation
- Clean, minimal navigation format with emoji arrows
- Standardized navigation across 19 documentation files

### Removed
- Redundant text labels for better readability

## [1.1.3] - 2024

### Fixed
- Arrow symbols (→) causing lexical errors in Mermaid
- Applied consistent multi-line formatting for @Injectable decorators
- Quoted all node labels containing special characters
- Ensured all diagrams render correctly on GitHub

## [1.1.2] - 2024

### Fixed
- Mermaid diagram rendering issues
- Quoted special characters in node labels
- Optimized diagram orientations (horizontal for flows, vertical for hierarchies)
- Fixed @Injectable, Promise<>, Map<>, and other special syntax
- Improved overall diagram readability

## [1.1.1] - 2024

### Changed
- Improved documentation clarity
- Removed color styling from diagrams
- Vertical diagram orientation
- Implementation-specific documentation
- Enhanced with visual emojis

## [1.1.0] - 2024

### Added
- Persistent storage with IndexedDB
- Storage provider selection at runtime
- Enhanced content preview with multiple formats
- Modal content selection with preview
- Blog post support in DISOT entries
- Previous entry preview functionality

## [1.0.0] - 2024

### Added
- Initial release with core CAS/DISOT functionality
- Content Addressable Storage with SHA-256 hashing
- DISOT entry creation and verification
- Digital signature support
- In-memory storage provider
- Angular 18 standalone components
- Comprehensive test suite
- Basic documentation