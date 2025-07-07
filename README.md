# CAS/DISOT - Decentralized Content Management System

[![Angular](https://img.shields.io/badge/Angular-v20-red.svg)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-v20.19%2B%20%7C%20v22.12%2B-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.8-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-492%20passing-brightgreen.svg)](https://github.com/o2alexanderfedin/angular-cas-disot/actions)
[![Coverage](https://img.shields.io/badge/Coverage-78.08%25-yellow.svg)](https://o2alexanderfedin.github.io/angular-cas-disot/coverage/cas-app/)
[![CI/CD](https://github.com/o2alexanderfedin/angular-cas-disot/workflows/CI/CD%20Pipeline/badge.svg)](https://github.com/o2alexanderfedin/angular-cas-disot/actions)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/badge/Release-v3.3.0-orange.svg)](https://github.com/o2alexanderfedin/angular-cas-disot/releases/tag/3.3.0)

A decentralized content management system implementing Content Addressable Storage (CAS) and Decentralized Immutable Source of Truth (DISOT) with digital signatures.

## 🚀 Features

### Content Addressable Storage (CAS)
- **SHA-256 Hashing**: Every piece of content is addressed by its cryptographic hash
- **Automatic Deduplication**: Identical content is stored only once
- **Content Integrity**: Hash verification ensures content hasn't been tampered with
- **Metadata Support**: Store additional information alongside content
- **Multiple Storage Providers**: In-memory, IndexedDB, IPFS, and Helia (browser-native IPFS)

### DISOT (Decentralized Immutable Source of Truth)
- **Digital Signatures**: Create cryptographically signed entries
- **Entry Types**: Support for BLOG_POST, DOCUMENT, IMAGE, and SIGNATURE types
- **Signature Verification**: Verify the authenticity of any entry
- **Timestamp Proof**: Each entry includes a timestamp for temporal ordering
- **Blog Post Support**: Create blog posts directly within DISOT entries

### User Interface
- **Modern Angular 18**: Built with standalone components
- **Responsive Design**: Works seamlessly on desktop and mobile
- **File Upload**: Drag-and-drop or click to upload
- **Content Browser**: Search and preview stored content with multiple view formats
- **Entry Management**: Create and verify DISOT entries
- **Content Preview**: View content as Text, JSON, Hex, Base64, or Image
- **Modal Selection**: Elegant content selection with preview capability
- **Previous Entries**: View and preview historical DISOT entries

### New in v3.3.0
- **Automatic MIME Type Detection**: Content references now auto-detect MIME types
- **Enhanced Metadata Entry**: Author and previous version hash selection via modal
- **Improved UX**: Streamlined content selection across the application

### New in v3.2.0
- **Author Selection Modal**: Browse and select author hashes
- **Previous Version Selection**: Visual selection for version tracking
- **Metadata Improvements**: Enhanced metadata entry workflow

### New in v3.1.0
- **Hash Selection for Records**: Browse and select hashes from CAS
- **Reusable Content Selection**: Unified modal component
- **Code Refactoring**: Removed duplicate services, improved code reuse

### New in v3.0.1
- **Fixed CI Test Failures**: Resolved race conditions and test mocking issues
- **Budget Adjustment**: Increased bundle size limits for Helia dependencies
- **Test Coverage**: All 402 tests now passing with 78.08% code coverage

### New in v3.0.0 - IPFS Integration
- **IPFS Storage Provider**: Distributed storage using external IPFS node
- **Helia Storage Provider**: Browser-native IPFS implementation with IndexedDB
- **Content Migration**: Migrate existing content from local storage to IPFS/Helia
- **Share Links**: Generate shareable IPFS gateway URLs for content
- **Upload Queue**: Persistent queue with retry logic for IPFS uploads
- **Health Monitoring**: Real-time IPFS node health status indicators
- **Hybrid Storage**: Local caching with distributed IPFS backend
- **Migration UI**: Bulk content transfer with progress tracking

## 📋 Table of Contents

- [Live Demo](#-live-demo)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Development](#-development)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Documentation](#-documentation)
- [GitFlow Workflow](#-gitflow-workflow)
- [Contributing](#-contributing)

## 🌐 Live Demo

### **Production Environment**
🚀 **https://o2alexanderfedin.github.io/angular-cas-disot**

### **Staging Environment**
🎭 **https://o2alexanderfedin.github.io/angular-cas-disot/staging**

### **Coverage Reports**
📊 **https://o2alexanderfedin.github.io/angular-cas-disot/coverage/cas-app/**

> **Note**: Both environments are currently updated from the `master` branch. The staging environment provides a testing ground for validating changes before they go live.
- [Roadmap](#-roadmap)

## 🛠 Installation

### Prerequisites
- **Node.js v20.19+ or v22.12+** (required for Angular CLI v20)
- npm v9+
- Git

> **⚠️ Important**: Angular CLI v20 requires Node.js v20.19+ or v22.12+. Earlier versions are not supported.

### Setup

1. Clone the repository:
```bash
git clone https://github.com/o2alexanderfedin/angular-cas-disot.git
cd angular-cas-disot
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:4200/`

## 🚦 Quick Start

### Upload Content
1. Navigate to the "Upload" tab
2. Select or drag a file
3. Click "Upload" to store it in CAS
4. Copy the generated hash for future retrieval

### Create DISOT Entry
1. Go to "Create Entry" tab
2. Select previously uploaded content
3. Choose entry type (CREATE/UPDATE/DELETE)
4. The system generates a key pair automatically
5. Click "Create Entry" to sign and store

### Verify Entry
1. Navigate to "Verify" tab
2. Enter an entry ID
3. Click "Load & Verify"
4. View verification results and entry details

## 🏗 Architecture

The application follows Clean Architecture principles with clear separation of concerns:

```
src/app/
├── core/                 # Business logic and interfaces
│   ├── domain/          # Domain models and interfaces
│   └── services/        # Application services
├── features/            # Feature modules
│   ├── content/         # Content management components
│   └── disot/           # DISOT components
├── shared/              # Shared modules and utilities
└── app.ts              # Root component
```

### Key Design Patterns
- **Dependency Injection**: Services provided at root level
- **Factory Pattern**: Storage provider selection at runtime
- **Clean Architecture**: Clear separation between UI, business logic, and infrastructure
- **Content Addressing**: SHA-256 based deduplication

For detailed architecture documentation, see [Technical Architecture](docs/ARCHITECTURE.md) and [Architecture Diagrams](docs/architecture/overview.md).

## 💻 Development

### Development Server
```bash
npm start
```
Navigate to `http://localhost:4200/`. The app will automatically reload on changes.

### Build
```bash
npm run build
```
Build artifacts will be stored in the `dist/` directory.

### Code Generation
Generate new components:
```bash
ng generate component features/my-feature --standalone
```

Generate new services:
```bash
ng generate service core/services/my-service
```

## 🚀 Deployment

This project uses a comprehensive CI/CD pipeline with automated deployments to GitHub Pages.

### **Automatic Deployments**

#### **Staging Environment**
- **Trigger**: Push to `master` branch  
- **URL**: https://o2alexanderfedin.github.io/angular-cas-disot/staging
- **Purpose**: Integration testing and review

#### **Production Environment**
- **Trigger**: Push to `master` branch or tagged releases
- **URL**: https://o2alexanderfedin.github.io/angular-cas-disot
- **Purpose**: Live application for end users

### **Local Preview Commands**
```bash
# Preview staging build locally
npm run preview:staging

# Preview production build locally  
npm run preview:production
```

### **Deployment Requirements**
- ✅ All CI tests must pass
- ✅ Code coverage requirements met
- ✅ Automated deployment (no manual intervention)
- ✅ Rollback capability via GitHub

> **📖 For detailed deployment documentation, see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)**

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```
Executes unit tests via [Karma](https://karma-runner.github.io) in headless Chrome.

### Test Coverage
The project maintains high test coverage with 492 tests across all components and services:
- Statements: 86.48%
- Functions: 86.88%
- Branches: 75.67%
- Lines: 87.6%
- All tests passing ✅

### Test Structure
```typescript
describe('CasService', () => {
  // Setup
  beforeEach(() => {
    // Test configuration
  });
  
  // Test cases
  it('should store content and return hash', async () => {
    // Test implementation
  });
});
```

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

- [Technical Architecture](docs/ARCHITECTURE.md) - Detailed system architecture and design
- [API Documentation](docs/API.md) - Complete API reference for all services
- [Developer Guide](docs/CLAUDE.md) - Development setup and guidelines
- [Architecture Overview](docs/architecture/overview.md) - Visual architecture diagrams
- [Component Reference](docs/components/README.md) - UI component documentation
- [Service Reference](docs/services/README.md) - Service implementation details

All documentation includes code examples and visual diagrams.

## 🔀 GitFlow Workflow

This project uses GitFlow for version management:

### Branch Structure
- `master` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - Feature branches
- `release/*` - Release preparation branches
- `hotfix/*` - Emergency fixes

### Common Commands

Start a new feature:
```bash
git flow feature start my-feature
```

Finish a feature:
```bash
git flow feature finish my-feature
```

Start a release:
```bash
git flow release start 1.1.0
```

Create a hotfix:
```bash
git flow hotfix start 1.0.1
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git flow feature start amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request to `develop` branch

### Coding Standards
- Follow Angular style guide
- Write tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

## 🗺 Roadmap

### Version 3.0.1 (Released)
- [x] Fixed CI test failures in IPFS integration
- [x] Resolved race conditions in migration service
- [x] Fixed test mocking issues
- [x] Increased bundle size budget for Helia

### Version 3.0.0 (Released) - IPFS Integration Phase 1
- [x] IPFS storage provider with HTTP API client
- [x] Helia browser-native IPFS implementation
- [x] Content migration service with progress tracking
- [x] Share link generation for IPFS gateways
- [x] Upload queue with persistence and retry logic
- [x] Health monitoring for IPFS nodes
- [x] Migration UI with bulk transfer capability
- [x] Comprehensive test coverage (402 tests)

### Version 2.5.1 (Released)
- [x] Comprehensive documentation update
- [x] Browser storage and security documentation
- [x] Code cleanup guide integration
- [x] Enhanced developer guide structure

### Version 2.5.0 (Released)
- [x] Fixed staging deployment conflicts
- [x] Enabled TypeScript strict mode
- [x] Added dynamic code coverage display
- [x] Improved CI/CD pipeline

### Version 2.0.0 (Released)
- [x] Complete documentation restructuring
- [x] Numbered, audience-based folder organization
- [x] Separated current docs from future roadmap
- [x] Added user guides and deployment documentation
- [x] Fixed all 390 cross-references and navigation links
- [x] Created comprehensive changelog and resources sections

### Version 1.2.0 (Released)
- [x] Phase 1 IPFS Integration Architecture documented
- [x] Detailed implementation guide with code examples
- [x] Story point-based roadmap for AI development
- [x] Security and performance considerations
- [x] Deployment architecture for development and production

### Version 1.1.4 (Released)
- [x] Added consistent navigation emojis across all documentation
- [x] Implemented clean, minimal navigation format with emoji arrows
- [x] Removed redundant text labels for better readability
- [x] Standardized navigation across 19 documentation files

### Version 1.1.3 (Released)
- [x] Fixed arrow symbols (→) causing lexical errors in Mermaid
- [x] Applied consistent multi-line formatting for @Injectable decorators
- [x] Quoted all node labels containing special characters
- [x] Ensured all diagrams render correctly on GitHub

### Version 1.1.2 (Released)
- [x] Fixed Mermaid diagram rendering issues
- [x] Quoted special characters in node labels
- [x] Optimized diagram orientations (horizontal for flows, vertical for hierarchies)
- [x] Fixed @Injectable, Promise<>, Map<>, and other special syntax
- [x] Improved overall diagram readability

### Version 1.1.1 (Released)
- [x] Improved documentation clarity
- [x] Removed color styling from diagrams
- [x] Vertical diagram orientation
- [x] Implementation-specific documentation
- [x] Enhanced with visual emojis

### Version 1.1.0 (Released)
- [x] Persistent storage (IndexedDB)
- [x] Storage provider selection
- [x] Enhanced content preview
- [x] Modal content selection
- [x] Blog post support in DISOT
- [x] Previous entry previews

### Version 3.1.0 (Future)
- [ ] IPFS pinning service integration
- [ ] Advanced IPFS gateway configuration
- [ ] Content encryption for IPFS
- [ ] IPNS (InterPlanetary Name System) support
- [ ] P2P content discovery

### Version 3.2.0 (Future)
- [ ] User authentication
- [ ] Permission management
- [ ] API endpoints
- [ ] WebSocket support for real-time updates

### Version 4.0.0 (Long-term)
- [ ] Blockchain anchoring for IPFS hashes
- [ ] Smart contract integration
- [ ] Decentralized identity (DID) support
- [ ] Mobile applications with IPFS support
- [ ] Advanced P2P synchronization

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Angular CLI](https://github.com/angular/angular-cli) version 20.0.5
- Cryptography via [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- Testing with [Karma](https://karma-runner.github.io) and [Jasmine](https://jasmine.github.io/)

## 📞 Support

For questions and support:
- Open an issue on [GitHub](https://github.com/o2alexanderfedin/angular-cas-disot/issues)
- Check the [documentation](docs/)
- Review [closed issues](https://github.com/o2alexanderfedin/angular-cas-disot/issues?q=is%3Aissue+is%3Aclosed)

---

Made with ❤️ by the CAS/DISOT team