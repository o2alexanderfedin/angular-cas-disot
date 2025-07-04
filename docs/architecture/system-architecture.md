# System Architecture

[← Architecture Overview](./overview.md) | [Home](../README.md) | [Next: Data Flow →](./data-flow.md)

## Table of Contents

1. [System Overview](#system-overview)
2. [Architectural Patterns](#architectural-patterns)
3. [Module Structure](#module-structure)
4. [Dependency Graph](#dependency-graph)
5. [Deployment Architecture](#deployment-architecture)

## System Overview

```mermaid
C4Context
    title System Context Diagram for CAS/DISOT Application

    Person(user, "User", "Content creator/verifier")
    System(cas_system, "CAS/DISOT System", "Content addressable storage with signature verification")
    System_Ext(browser_storage, "Browser Storage", "Local/Session storage")
    System_Ext(crypto_api, "Web Crypto API", "Browser cryptography")

    Rel(user, cas_system, "Upload content, Create entries, Verify signatures")
    Rel(cas_system, browser_storage, "Store/Retrieve content")
    Rel(cas_system, crypto_api, "Hash content, Sign/Verify")
```

## Architectural Patterns

### Hexagonal Architecture

```mermaid
graph TB
    subgraph "Application Core"
        subgraph "Domain"
            DM[Domain Models]
            DI[Domain Interfaces]
            BR[Business Rules]
        end
        
        subgraph "Application"
            UC[Use Cases]
            SVC[Application Services]
        end
    end
    
    subgraph "Adapters"
        subgraph "Primary Adapters"
            UI[UI Components]
            API[API Controllers]
        end
        
        subgraph "Secondary Adapters"
            STOR[Storage Adapter]
            CRYPTO[Crypto Adapter]
        end
    end
    
    UI --> UC
    API --> UC
    UC --> SVC
    SVC --> DI
    DI <--> DM
    DM --> BR
    
    STOR -.-> DI
    CRYPTO -.-> DI
    
    style DM fill:#fce4ec,stroke:#880e4f
    style DI fill:#e8eaf6,stroke:#283593
    style UC fill:#e0f2f1,stroke:#004d40
    style UI fill:#fff3e0,stroke:#e65100
```

### Clean Architecture Layers

```mermaid
graph TD
    subgraph "Presentation Layer"
        COMP[Components]
        TEMP[Templates]
        STYLES[Styles]
    end
    
    subgraph "Application Layer"
        APP_SVC[Application Services]
        DTO[Data Transfer Objects]
        MAP[Mappers]
    end
    
    subgraph "Domain Layer"
        ENT[Entities]
        VO[Value Objects]
        DOM_SVC[Domain Services]
        REPO[Repository Interfaces]
    end
    
    subgraph "Infrastructure Layer"
        IMPL[Repository Implementations]
        EXT[External Services]
        CONF[Configuration]
    end
    
    COMP --> APP_SVC
    APP_SVC --> DTO
    DTO --> MAP
    MAP --> ENT
    APP_SVC --> DOM_SVC
    DOM_SVC --> REPO
    IMPL -.-> REPO
    EXT --> IMPL
    
    style COMP fill:#e1bee7,stroke:#4a148c
    style APP_SVC fill:#c5cae9,stroke:#1a237e
    style ENT fill:#c8e6c9,stroke:#1b5e20
    style IMPL fill:#ffccbc,stroke:#bf360c
```

## Module Structure

### Angular Module Organization

```mermaid
graph TD
    subgraph "App Module"
        APP[App Component]
        ROUTES[App Routes]
    end
    
    subgraph "Core Module"
        subgraph "Domain"
            INTERFACES[Interfaces]
        end
        
        subgraph "Services"
            CORE_SVC[Core Services]
        end
    end
    
    subgraph "Feature Modules"
        subgraph "Content Module"
            C_LIST[Content List]
            C_UPLOAD[Content Upload]
        end
        
        subgraph "DISOT Module"
            D_ENTRY[DISOT Entry]
            D_VERIFY[Signature Verification]
        end
    end
    
    subgraph "Shared Module"
        SHARED[Shared Components]
        PIPES[Pipes]
        DIRECTIVES[Directives]
    end
    
    APP --> ROUTES
    ROUTES --> C_LIST
    ROUTES --> C_UPLOAD
    ROUTES --> D_ENTRY
    ROUTES --> D_VERIFY
    
    C_LIST --> CORE_SVC
    C_UPLOAD --> CORE_SVC
    D_ENTRY --> CORE_SVC
    D_VERIFY --> CORE_SVC
    
    C_LIST --> SHARED
    C_UPLOAD --> SHARED
    D_ENTRY --> SHARED
    D_VERIFY --> SHARED
    
    CORE_SVC --> INTERFACES
```

### File System Structure

```mermaid
graph TD
    subgraph "src/app"
        ROOT["/"]
        
        ROOT --> CORE[core/]
        ROOT --> FEATURES[features/]
        ROOT --> SHARED[shared/]
        
        CORE --> DOMAIN[domain/]
        CORE --> SERVICES[services/]
        
        DOMAIN --> INTF[interfaces/]
        
        FEATURES --> CONTENT[content/]
        FEATURES --> DISOT[disot/]
        
        CONTENT --> C_LIST[content-list/]
        CONTENT --> C_UPLOAD[content-upload/]
        
        DISOT --> D_ENTRY[disot-entry/]
        DISOT --> D_VERIFY[signature-verification/]
    end
    
    style ROOT fill:#fff,stroke:#333,stroke-width:3px
    style CORE fill:#e3f2fd,stroke:#1565c0
    style FEATURES fill:#f3e5f5,stroke:#6a1b9a
    style SHARED fill:#e8f5e9,stroke:#2e7d32
```

## Dependency Graph

### Service Dependencies

```mermaid
graph LR
    subgraph "UI Components"
        CLC[ContentListComponent]
        CUC[ContentUploadComponent]
        DEC[DisotEntryComponent]
        SVC[SignatureVerificationComponent]
    end
    
    subgraph "Application Services"
        CAS[CasService]
        DISOT[DisotService]
    end
    
    subgraph "Infrastructure Services"
        HASH[HashService]
        SIG[SignatureService]
        STOR[StorageService]
    end
    
    CLC --> CAS
    CUC --> CAS
    DEC --> DISOT
    SVC --> DISOT
    
    CAS --> HASH
    CAS --> STOR
    
    DISOT --> CAS
    DISOT --> SIG
    DISOT --> HASH
    
    style CLC fill:#ffebee,stroke:#c62828
    style CAS fill:#e8eaf6,stroke:#3f51b5
    style HASH fill:#e0f7fa,stroke:#006064
```

### Interface Dependencies

```mermaid
classDiagram
    class IContentStorage {
        <<interface>>
        +store(content: Content): ContentHash
        +retrieve(hash: ContentHash): Content
    }
    
    class IHashService {
        <<interface>>
        +hash(data: Uint8Array): string
    }
    
    class ISignatureService {
        <<interface>>
        +sign(data: Uint8Array, privateKey: string): Signature
        +verify(data: Uint8Array, signature: Signature): boolean
    }
    
    class IStorageProvider {
        <<interface>>
        +read(path: string): Uint8Array
        +write(path: string, data: Uint8Array): void
        +exists(path: string): boolean
    }
    
    class CasService {
        -hashService: IHashService
        -storageService: IStorageProvider
    }
    
    class DisotService {
        -casService: IContentStorage
        -signatureService: ISignatureService
        -hashService: IHashService
    }
    
    CasService ..|> IContentStorage
    CasService --> IHashService
    CasService --> IStorageProvider
    DisotService --> IContentStorage
    DisotService --> ISignatureService
    DisotService --> IHashService
```

## Deployment Architecture

### Browser-Based Deployment

```mermaid
graph TD
    subgraph "User Browser"
        subgraph "Angular Application"
            SPA[Single Page App]
            ROUTER[Angular Router]
            SERVICES[Services]
        end
        
        subgraph "Browser APIs"
            CRYPTO[Web Crypto API]
            STORAGE[Local Storage]
            SESSION[Session Storage]
        end
    end
    
    subgraph "Build Artifacts"
        HTML[index.html]
        JS[JavaScript Bundles]
        CSS[CSS Styles]
        ASSETS[Static Assets]
    end
    
    subgraph "Web Server"
        STATIC[Static File Server]
    end
    
    STATIC --> HTML
    STATIC --> JS
    STATIC --> CSS
    STATIC --> ASSETS
    
    SPA --> CRYPTO
    SERVICES --> STORAGE
    SERVICES --> SESSION
    
    style SPA fill:#e1bee7,stroke:#4a148c
    style CRYPTO fill:#ffecb3,stroke:#ff6f00
    style STATIC fill:#c5e1a5,stroke:#33691e
```

### Production Architecture

```mermaid
graph TB
    subgraph "CDN"
        CF[CloudFront/CDN]
    end
    
    subgraph "Origin"
        S3[S3 Bucket]
        NG[Angular App]
    end
    
    subgraph "Future Services"
        API[API Gateway]
        IPFS[IPFS Node]
        BC[Blockchain]
    end
    
    subgraph "Client"
        BROWSER[Web Browser]
    end
    
    BROWSER --> CF
    CF --> S3
    S3 --> NG
    
    BROWSER -.-> API
    API -.-> IPFS
    API -.-> BC
    
    style CF fill:#ffecb3,stroke:#ff6f00
    style S3 fill:#fff3e0,stroke:#e65100
    style BROWSER fill:#e3f2fd,stroke:#1565c0
```

---

[← Architecture Overview](./overview.md) | [↑ Top](#system-architecture) | [Home](../README.md) | [Next: Data Flow →](./data-flow.md)