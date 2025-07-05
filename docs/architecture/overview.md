# Architecture Overview 🏗️

[← Home](../README.md) | [Next: System Architecture →](./system-architecture.md)

## Table of Contents

1. [Introduction](#introduction)
2. [High-Level Architecture](#high-level-architecture)
3. [Key Principles](#key-principles)
4. [Technology Stack](#technology-stack)
5. [System Components](#system-components)

## Introduction

The CAS/DISOT system implements content-addressable storage with cryptographic verification capabilities. Built with Angular 18+, it provides secure content management with SHA-256 hashing and digital signatures.

## High-Level Architecture

```mermaid
graph TB
    subgraph "🎨 Presentation Layer"
        UPLOAD[Content Upload<br/>Component]
        LIST[Content List<br/>Component]
        DISOT[DISOT Entry<br/>Component]
        VERIFY[Signature Verify<br/>Component]
        MODAL[Selection Modal<br/>Component]
    end
    
    subgraph "⚙️ Application Services"
        CAS_SVC[CAS Service<br/>Content Storage]
        DISOT_SVC[DISOT Service<br/>Entry Management]
    end
    
    subgraph "🔧 Infrastructure Services"
        HASH_SVC[Hash Service<br/>SHA-256]
        SIG_SVC[Signature Service<br/>Key Management]
        STOR_SVC[Storage Provider<br/>IndexedDB/Memory]
    end
    
    UPLOAD --> CAS_SVC
    LIST --> CAS_SVC
    DISOT --> DISOT_SVC
    DISOT --> CAS_SVC
    VERIFY --> DISOT_SVC
    MODAL --> CAS_SVC
    
    CAS_SVC --> HASH_SVC
    CAS_SVC --> STOR_SVC
    DISOT_SVC --> SIG_SVC
    DISOT_SVC --> HASH_SVC
    DISOT_SVC --> CAS_SVC
```

## Key Principles

### SOLID Principles Applied ✅

```mermaid
graph TD
    subgraph "S - Single Responsibility"
        CAS[CasService: Content Storage Only]
        HASH[HashService: SHA-256 Hashing Only]
        SIG[SignatureService: Crypto Operations Only]
    end
    
    subgraph "O - Open/Closed"
        IPROV[IStorageProvider Interface]
        MEM[InMemoryStorage]
        IDB[IndexedDbStorage]
        IPROV --> MEM
        IPROV --> IDB
    end
    
    subgraph "D - Dependency Inversion"
        COMP[Components]
        INTF[Interfaces]
        IMPL[Implementations]
        COMP --> INTF
        IMPL --> INTF
    end
```

### Clean Architecture Implementation 🎯

```mermaid
graph TD
    subgraph "Dependencies Point Inward"
        UI[UI Components]
        SVC[Services]
        INTF[Domain Interfaces]
        INFRA[Infrastructure]
        
        UI --> SVC
        SVC --> INTF
        INFRA --> INTF
    end
    
    subgraph "No Circular Dependencies"
        UI -.X.-> INFRA
        INTF -.X.-> SVC
        INTF -.X.-> UI
    end
```

## Technology Stack 🛠️

```mermaid
graph TD
    subgraph "Core Technologies"
        ANG[Angular 18.0.0]
        TS[TypeScript 5.8.2]
        RX[RxJS 7.8.0]
        ANG --> TS
        ANG --> RX
    end
    
    subgraph "Testing Stack"
        JASMINE[Jasmine 5.7.0]
        KARMA[Karma 6.4.0]
        KARMA --> JASMINE
    end
    
    subgraph "Web APIs Used"
        CRYPTO[Web Crypto API<br/>SHA-256 Hashing]
        IDB[IndexedDB API<br/>Persistent Storage]
        FILE[File API<br/>Content Upload]
    end
```

## System Components 📦

### CAS/DISOT Data Flow

```mermaid
graph TD
    subgraph "Content Flow"
        FILE[File Upload] --> HASH[SHA-256 Hash]
        HASH --> STORE[Store by Hash]
        STORE --> DEDUP[Deduplication Check]
        DEDUP --> SAVE[Save to Storage]
    end
    
    subgraph "DISOT Entry Flow"
        CONTENT[Select Content] --> SIGN[Sign with Private Key]
        SIGN --> ENTRY[Create DISOT Entry]
        ENTRY --> VERIFY[Verification Ready]
    end
    
    subgraph "Storage Options"
        MEM[In-Memory<br/>Fast but Temporary]
        IDB2[IndexedDB<br/>Persistent Browser Storage]
    end
```

### Component Responsibilities 📋

```mermaid
graph TD
    subgraph "UI Components"
        UPLOAD[📤 Content Upload<br/>- Drag & Drop<br/>- File Selection<br/>- Progress Display]
        LIST[📋 Content List<br/>- Search by Hash<br/>- Preview Content<br/>- Download Files]
        DISOT[✍️ DISOT Entry<br/>- Create Blog Posts<br/>- Sign Content<br/>- Generate Keys]
        VERIFY[✅ Signature Verify<br/>- Verify Entries<br/>- Check Signatures]
        MODAL[🔍 Selection Modal<br/>- Browse Content<br/>- Preview Items<br/>- Select for DISOT]
    end
```

---

[← Home](../README.md) | [↑ Top](#architecture-overview) | [Next: System Architecture →](./system-architecture.md)