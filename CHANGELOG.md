# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.6.1] - 2025-07-07

### Changed
- Improved Chain of Responsibility pattern implementation in P2P documentation
- Removed redundant `canHandle()` method from ContentSource interface
- Updated `retrieve()` method to return discriminated union Result type
- Enhanced P2PPeerSource with custom race implementation for parallel queries
- Updated to accurate libp2p API usage with native AbortSignal support

### Documentation
- Added full implementation code for parallel peer queries
- Documented why `Promise.race()` doesn't work for content discovery
- Added libp2p API notes about automatic cleanup and modern patterns
- Enhanced design patterns documentation with implementation details

## [3.6.0] - 2025-07-07

### Added
- Comprehensive Design Patterns documentation cataloging all OOD patterns used in the application
- Enhanced P2P documentation with detailed OOD pattern explanations
- Chain of Responsibility pattern documentation for content discovery
- Strategy Pattern documentation for routing algorithms
- Complete catalog of Factory, Singleton, Facade, Adapter, Observer, and State patterns

### Changed
- Converted ASCII diagrams to Mermaid format in P2P documentation
- Fixed Mermaid syntax issues with numbered lists in node labels
- Removed color styling from diagrams for consistency
- Updated architecture README with link to design patterns documentation

### Documentation
- Created `/docs/03-developer-guide/architecture/design-patterns.md`
- Enhanced `/docs/06-roadmap/phases/phase-3-p2p/ipfs-p2p-integration.md` with pattern details
- Updated `/docs/06-roadmap/phases/phase-3-p2p/README.md` with Mermaid diagrams

## [3.5.0] - 2025-07-07

### Added
- Comprehensive Decentralized Identity (DID) documentation structure
- P2P networking documentation for Phase 3
- IPFS-P2P integration documentation
- Phase roadmap updates (P2P replacing blockchain)

### Changed
- Deprecated Phase 2 blockchain in favor of P2P approach
- Enhanced navigation headers/footers across documentation

### Documentation
- Created `/docs/decentralized-identity/` directory structure
- Created `/docs/06-roadmap/phases/phase-3-p2p/` documentation
- Added IPFS-P2P hybrid protocol design

## [3.4.0] - 2025-07-05

### Documentation
- Created comprehensive technical architecture documentation
- Added ARCHITECTURE.md with complete system design overview
- Added API.md with detailed service API documentation
- Updated README with architecture references

## [3.3.0] - 2025-07-05

### Added
- Automatic MIME type detection for metadata entry content references
- Content hash selection for author field in metadata entries
- Content hash selection for previous version field in metadata entries
- Enhanced user experience with smart content type detection

### Changed
- Metadata entry form now auto-populates MIME type when content is selected
- Author and previous version fields now use ContentSelectionModal for consistency

## [3.2.0] - 2025-07-05

### Added
- Author selection modal for metadata entries using ContentSelectionModal
- Previous version selection modal for metadata entries
- Enhanced DisotService to accept metadata parameter

### Changed
- Improved metadata entry workflow with consistent hash selection UI
- Updated all metadata-related components to use unified selection approach

## [3.1.0] - 2025-07-05

### Added
- Hash selection functionality for DISOT entries using ContentSelectionModal
- ContentPreviewService for reusable content preview logic

### Changed
- Refactored to reuse existing ContentSelectionModal component
- Removed duplicate HashSelectionService and modal component
- Achieved 70% code reduction through component reuse

### Fixed
- All migration component tests
- ContentPreviewService test coverage
- Integration test compatibility

## [3.0.4] - 2025-01-06

### Added
- Comprehensive metadata entry architecture documentation
- TypeScript interfaces for metadata content management
- Mermaid diagrams for visual architecture representation
- API reference for metadata service methods
- Implementation guide with code examples
- Real-world usage examples for various metadata scenarios

### Changed
- Simplified metadata storage to use single DISOT entry
- Updated DisotService interface to accept content directly
- Removed unnecessary CAS dependency for metadata

### Technical
- Follow KISS, SOLID, DRY, and Clean Architecture principles
- Single storage operation per metadata entry
- Direct access to metadata without additional retrieval steps

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