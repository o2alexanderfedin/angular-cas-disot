# CAS/DISOT Technical Documentation

## Table of Contents

1. [Architecture Overview](./architecture/overview.md)
2. [System Architecture](./architecture/system-architecture.md)
3. [Data Flow](./architecture/data-flow.md)
4. [Component Architecture](./architecture/component-architecture.md)
5. [Service Architecture](./architecture/service-architecture.md)
6. [Security Architecture](./architecture/security.md)
7. [API Reference](./api/README.md)
8. [Component Reference](./components/README.md)
9. [Service Reference](./services/README.md)
10. [Testing Guide](./testing/testing-guide.md)

## Quick Start

This documentation provides a comprehensive technical overview of the Content Addressable Storage (CAS) and Decentralized Immutable Source of Truth (DISOT) system implemented in Angular.

### Key Concepts

- **CAS (Content Addressable Storage)**: A storage system where content is addressed by its cryptographic hash
- **DISOT (Decentralized Immutable Source of Truth)**: A system for creating verifiable, tamper-proof records using digital signatures
- **Clean Architecture**: Separation of concerns with clear boundaries between layers

### Documentation Structure

```mermaid
graph TD
    A[Documentation Root] --> B[Architecture]
    A --> C[API Reference]
    A --> D[Component Reference]
    A --> E[Service Reference]
    
    B --> F[Overview]
    B --> G[System Architecture]
    B --> H[Data Flow]
    B --> I[Component Architecture]
    B --> J[Service Architecture]
    B --> K[Security]
    
    style A fill:#f9f,stroke:#333,stroke-width:4px
    style B fill:#bbf,stroke:#333,stroke-width:2px
    style C fill:#bbf,stroke:#333,stroke-width:2px
    style D fill:#bbf,stroke:#333,stroke-width:2px
    style E fill:#bbf,stroke:#333,stroke-width:2px
```

---

[Next: Architecture Overview →](./architecture/overview.md)