# Developer Guide 💻

Everything you need to develop and contribute to CAS/DISOT.

## Table of Contents

### Architecture 🏗️
- [Browser Storage Options](./architecture/browser-storage.md) - Comprehensive analysis of browser storage technologies
- [System Design](./architecture/system-design.md) - Overall system architecture and patterns
- [API Design](./architecture/api-design.md) - API architecture and communication patterns
- [Architecture Documentation](./architecture/) - Complete architecture documentation

### Features 🚀
- [IPFS Integration](./features/ipfs-integration.md) - Distributed storage with IPFS
- [libp2p Integration](./features/libp2p-integration.md) - Peer-to-peer networking
- [Hybrid Integration](./features/ipfs-libp2p-integration.md) - Combined IPFS and libp2p features
- [All Features](./features/) - Complete feature documentation

### Security 🔒
- [IndexedDB Security & Isolation](./security/indexeddb-security.md) - Detailed security analysis of IndexedDB
- [Security Best Practices](./security/best-practices.md) - General security guidelines
- [Authentication Guide](./security/authentication.md) - Authentication patterns and implementation

### Maintenance 🛠️
- [Code Cleanup Guide](./maintenance/code-cleanup-guide.md) - Tools and strategies for removing unused code

### Testing 🧪
- [Testing Strategy](./testing/testing-strategy.md) - Testing approaches and coverage
- [Unit Testing](./testing/unit-testing.md) - Writing and running unit tests
- [Integration Testing](./testing/integration-testing.md) - End-to-end testing approaches

### Implementation 💡
- [Project Structure](./implementation/project-structure.md) - Understanding the codebase organization
- [Contributing Guide](./contributing.md) - How to contribute to the project
- [Build Process](../05-deployment/build-process.md) - Understanding the build pipeline

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/o2alexanderfedin/angular-cas-disot.git
   cd angular-cas-disot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm start
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Key Technologies

- **Angular 18** - Frontend framework
- **TypeScript** - Type-safe JavaScript
- **IndexedDB** - Browser storage
- **Web Crypto API** - Cryptographic operations
- **RxJS** - Reactive programming
- **Karma/Jasmine** - Testing framework

## Development Principles

1. **Clean Architecture** - Clear separation of concerns
2. **Test-Driven Development** - Write tests first
3. **Type Safety** - Leverage TypeScript's type system
4. **Performance First** - Optimize for browser performance
5. **Security by Design** - Build security into every feature

---

[🏠 Documentation Home](../)
