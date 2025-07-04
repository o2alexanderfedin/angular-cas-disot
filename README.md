# CAS/DISOT - Decentralized Content Management System

[![Angular](https://img.shields.io/badge/Angular-v18-red.svg)](https://angular.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.5-blue.svg)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-74%20passing-brightgreen.svg)](https://github.com/o2alexanderfedin/angular-cas-disot/actions)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Release](https://img.shields.io/badge/Release-v1.0.0-orange.svg)](https://github.com/o2alexanderfedin/angular-cas-disot/releases/tag/v1.0.0)

A decentralized content management system implementing Content Addressable Storage (CAS) and Decentralized Immutable Source of Truth (DISOT) with digital signatures.

## 🚀 Features

### Content Addressable Storage (CAS)
- **SHA-256 Hashing**: Every piece of content is addressed by its cryptographic hash
- **Automatic Deduplication**: Identical content is stored only once
- **Content Integrity**: Hash verification ensures content hasn't been tampered with
- **Metadata Support**: Store additional information alongside content

### DISOT (Decentralized Immutable Source of Truth)
- **Digital Signatures**: Create cryptographically signed entries
- **Entry Types**: Support for CREATE, UPDATE, and DELETE operations
- **Signature Verification**: Verify the authenticity of any entry
- **Timestamp Proof**: Each entry includes a timestamp for temporal ordering

### User Interface
- **Modern Angular 18**: Built with standalone components
- **Responsive Design**: Works seamlessly on desktop and mobile
- **File Upload**: Drag-and-drop or click to upload
- **Content Browser**: Search and preview stored content
- **Entry Management**: Create and verify DISOT entries

## 📋 Table of Contents

- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Development](#-development)
- [Testing](#-testing)
- [Documentation](#-documentation)
- [GitFlow Workflow](#-gitflow-workflow)
- [Contributing](#-contributing)
- [Roadmap](#-roadmap)

## 🛠 Installation

### Prerequisites
- Node.js v18+ (or v20+ recommended)
- npm v9+
- Git

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
- **Dependency Injection**: Services are injected, not instantiated
- **Interface Segregation**: Small, focused interfaces
- **Single Responsibility**: Each service/component has one purpose
- **Test-Driven Development**: Tests written before implementation

For detailed architecture documentation, see [docs/architecture](docs/architecture/overview.md).

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

## 🧪 Testing

### Run Unit Tests
```bash
npm test
```
Executes unit tests via [Karma](https://karma-runner.github.io) in headless Chrome.

### Test Coverage
The project maintains high test coverage with 74 tests across all components and services:
- Services: 30 tests
- Components: 44 tests

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

- [Architecture Overview](docs/architecture/overview.md)
- [API Reference](docs/api/README.md)
- [Component Reference](docs/components/README.md)
- [Service Reference](docs/services/README.md)

All documentation includes Mermaid diagrams for visual representation.

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

### Version 1.1.0 (Planned)
- [ ] Real secp256k1 implementation
- [ ] Persistent storage (IndexedDB)
- [ ] Import/Export functionality
- [ ] Batch operations support

### Version 1.2.0 (Future)
- [ ] User authentication
- [ ] Permission management
- [ ] API endpoints
- [ ] WebSocket support

### Version 2.0.0 (Long-term)
- [ ] IPFS integration
- [ ] Blockchain anchoring
- [ ] P2P synchronization
- [ ] Mobile applications

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