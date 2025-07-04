# Architecture Overview

[← Home](../README.md) | [Next: System Architecture →](./system-architecture.md)

## Table of Contents

1. [Introduction](#introduction)
2. [High-Level Architecture](#high-level-architecture)
3. [Key Principles](#key-principles)
4. [Technology Stack](#technology-stack)
5. [System Components](#system-components)

## Introduction

The CAS/DISOT system is built using Angular with a clean architecture approach, emphasizing separation of concerns, testability, and maintainability. The system implements content-addressable storage with cryptographic verification capabilities.

## High-Level Architecture

```mermaid
graph TB
    subgraph "Presentation Layer"
        UI[Angular Components]
        RT[Router]
    end
    
    subgraph "Application Layer"
        SVC[Services]
        INT[Interfaces]
    end
    
    subgraph "Domain Layer"
        DOM[Domain Models]
        BL[Business Logic]
    end
    
    subgraph "Infrastructure Layer"
        STOR[Storage Providers]
        CRYPTO[Cryptography Providers]
    end
    
    UI --> SVC
    RT --> UI
    SVC --> INT
    SVC --> DOM
    DOM --> BL
    SVC --> STOR
    SVC --> CRYPTO
    
    style UI fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    style SVC fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    style DOM fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    style STOR fill:#fff3e0,stroke:#e65100,stroke-width:2px
```

## Key Principles

### SOLID Principles

```mermaid
mindmap
  root((SOLID))
    S[Single Responsibility]
      Each service has one job
      Components handle one feature
    O[Open/Closed]
      Extensible via interfaces
      Closed for modification
    L[Liskov Substitution]
      Service implementations
      Interchangeable providers
    I[Interface Segregation]
      Focused interfaces
      No unused methods
    D[Dependency Inversion]
      Depend on abstractions
      Inject dependencies
```

### Clean Architecture Layers

```mermaid
graph LR
    subgraph "Dependencies Flow"
        A[UI Components] --> B[Application Services]
        B --> C[Domain Interfaces]
        B --> D[Infrastructure]
        D -.-> C
    end
    
    style A fill:#ffebee,stroke:#c62828
    style B fill:#e3f2fd,stroke:#1565c0
    style C fill:#e8f5e9,stroke:#2e7d32
    style D fill:#fff8e1,stroke:#f57f17
```

## Technology Stack

```mermaid
graph TD
    subgraph "Frontend Framework"
        ANG[Angular 18+]
        TS[TypeScript 5.5+]
        RX[RxJS]
    end
    
    subgraph "Testing"
        KRM[Karma]
        JSM[Jasmine]
    end
    
    subgraph "Build Tools"
        NG[Angular CLI]
        WP[Webpack]
    end
    
    subgraph "APIs"
        WEB[Web Crypto API]
        STOR[Storage APIs]
    end
    
    ANG --> TS
    ANG --> RX
    ANG --> KRM
    KRM --> JSM
    ANG --> NG
    NG --> WP
    ANG --> WEB
    ANG --> STOR
```

## System Components

### Core Components Overview

```mermaid
graph TD
    subgraph "Feature Components"
        CU[Content Upload]
        CL[Content List]
        DE[DISOT Entry]
        SV[Signature Verification]
    end
    
    subgraph "Core Services"
        CAS[CAS Service]
        DISOT[DISOT Service]
        HASH[Hash Service]
        SIG[Signature Service]
        STORAGE[Storage Service]
    end
    
    subgraph "Domain Models"
        CONTENT[Content]
        ENTRY[DISOT Entry]
        SIG_MODEL[Signature]
        HASH_MODEL[Content Hash]
    end
    
    CU --> CAS
    CL --> CAS
    DE --> DISOT
    SV --> DISOT
    
    CAS --> HASH
    CAS --> STORAGE
    DISOT --> CAS
    DISOT --> SIG
    
    CAS --> CONTENT
    DISOT --> ENTRY
    SIG --> SIG_MODEL
    HASH --> HASH_MODEL
    
    style CU fill:#e1bee7,stroke:#4a148c
    style CL fill:#e1bee7,stroke:#4a148c
    style DE fill:#e1bee7,stroke:#4a148c
    style SV fill:#e1bee7,stroke:#4a148c
    style CAS fill:#c5cae9,stroke:#1a237e
    style DISOT fill:#c5cae9,stroke:#1a237e
```

### Component Interaction Flow

```mermaid
sequenceDiagram
    participant User
    participant Component
    participant Service
    participant Domain
    participant Infrastructure
    
    User->>Component: Interact
    Component->>Service: Call method
    Service->>Domain: Apply business logic
    Service->>Infrastructure: Persist/Retrieve
    Infrastructure-->>Service: Return data
    Service-->>Component: Return result
    Component-->>User: Update UI
```

---

[← Home](../README.md) | [↑ Top](#architecture-overview) | [Next: System Architecture →](./system-architecture.md)