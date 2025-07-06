[← Back to Developer Guide](../README.md)

---

# Architecture Documentation 🏗️

This section contains detailed architectural documentation for the CAS/DISOT Angular application.

## Core Architecture

### [System Design](./system-design.md)
Overall system architecture, patterns, and design principles that guide the application structure.

### [Data Flow](./data-flow.md)
How data moves through the application, from user interaction to storage and retrieval.

### [Service Design](./service-design.md)
Design patterns and principles for Angular services, dependency injection, and business logic.

### [Component Design](./component-design.md)
Component architecture, smart vs presentational components, and UI patterns.

## Storage & Persistence

### [Browser Storage Options](./browser-storage.md) 
Comprehensive analysis of browser storage technologies including localStorage, IndexedDB, Cache API, and OPFS.

## Security Architecture

### [Security Overview](./security.md)
Security architecture, threat modeling, and protection mechanisms.

### [IndexedDB Security](../security/indexeddb-security.md)
Detailed analysis of IndexedDB security model, isolation mechanisms, and cross-origin policies.

## Architecture Decision Records

### [Decision Records](./decisions/)
Important architectural decisions and their rationale.

## Key Principles

1. **Clean Architecture** - Clear separation between domain, application, and infrastructure layers
2. **Dependency Inversion** - Depend on abstractions, not concrete implementations
3. **Single Responsibility** - Each component/service has one reason to change
4. **Security by Design** - Security considerations built into every architectural decision
5. **Performance First** - Architecture optimized for browser performance

## Technology Stack

- **Frontend Framework**: Angular 18
- **Language**: TypeScript
- **State Management**: RxJS
- **Storage**: IndexedDB with fallback options
- **Cryptography**: Web Crypto API
- **Build Tool**: Angular CLI with Webpack
- **Testing**: Karma + Jasmine

## Quick Links

- [Developer Guide](../README.md)
- [Security Documentation](../security/)
- [Testing Strategy](../testing/)
- [API Reference](../../04-api-reference/)

---

[← Back to Developer Guide](../README.md) | [Top of Page](#architecture-documentation-)