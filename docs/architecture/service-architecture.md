# Service Architecture

[← Component Architecture](./component-architecture.md) | [Home](../README.md) | [Next: Security Architecture →](./security.md)

## Table of Contents

1. [Service Overview](#service-overview)
2. [Service Dependencies](#service-dependencies)
3. [Service Interfaces](#service-interfaces)
4. [Service Implementation](#service-implementation)
5. [Service Testing](#service-testing)

## Service Overview

### Service Layer Structure

```mermaid
graph TD
    subgraph "Core Services"
        CAS[CAS Service<br/>Content Storage]
        DISOT[DISOT Service<br/>Entry Management]
    end
    
    subgraph "Infrastructure Services"
        HASH[Hash Service<br/>SHA-256 Hashing]
        SIG[Signature Service<br/>Digital Signatures]
        STOR[Storage Service<br/>Data Persistence]
    end
    
    subgraph "Domain Interfaces"
        ICAS[IContentStorage]
        IHASH[IHashService]
        ISIG[ISignatureService]
        ISTOR[IStorageProvider]
    end
    
    CAS -.-> ICAS
    HASH -.-> IHASH
    SIG -.-> ISIG
    STOR -.-> ISTOR
    
    CAS --> HASH
    CAS --> STOR
    DISOT --> CAS
    DISOT --> SIG
    DISOT --> HASH
    
    style CAS fill:#e8eaf6,stroke:#3f51b5,stroke-width:3px
    style DISOT fill:#e8eaf6,stroke:#3f51b5,stroke-width:3px
```

### Service Responsibilities

```mermaid
mindmap
  root((Services))
    CAS Service
      Store content by hash
      Retrieve content
      List all content
      Deduplication
    DISOT Service
      Create entries
      Verify signatures
      Manage entry lifecycle
      Entry serialization
    Hash Service
      SHA-256 hashing
      Consistent encoding
      Web Crypto API
    Signature Service
      Generate key pairs
      Sign data
      Verify signatures
      Mock implementation
    Storage Service
      Read/Write operations
      Path management
      In-memory storage
      Future: persistence
```

## Service Dependencies

### Dependency Graph

```mermaid
graph TD
    subgraph "Application Layer"
        COMP[Components]
    end
    
    subgraph "Service Layer"
        CAS[CasService]
        DISOT[DisotService]
    end
    
    subgraph "Infrastructure Layer"
        HASH[HashService]
        SIG[SignatureService]
        STOR[LocalStorageService]
    end
    
    subgraph "External APIs"
        CRYPTO[Web Crypto API]
        MEM[Memory Storage]
    end
    
    COMP --> CAS
    COMP --> DISOT
    
    CAS --> HASH
    CAS --> STOR
    
    DISOT --> CAS
    DISOT --> SIG
    DISOT --> HASH
    
    HASH --> CRYPTO
    SIG --> CRYPTO
    STOR --> MEM
    
    style COMP fill:#e1bee7,stroke:#4a148c
    style CAS fill:#c5cae9,stroke:#1a237e
    style CRYPTO fill:#fff3e0,stroke:#e65100
```

### Service Injection Tree

```mermaid
graph TD
    subgraph "Root Injector"
        ROOT[Root]
    end
    
    subgraph "providedIn: 'root'"
        CAS[CasService]
        DISOT[DisotService]
        HASH[HashService]
        SIG[SignatureService]
        STOR[LocalStorageService]
    end
    
    subgraph "Component Injectors"
        CL[ContentList]
        CU[ContentUpload]
        DE[DisotEntry]
        SV[SignatureVerify]
    end
    
    ROOT --> CAS
    ROOT --> DISOT
    ROOT --> HASH
    ROOT --> SIG
    ROOT --> STOR
    
    CL -.-> CAS
    CU -.-> CAS
    DE -.-> DISOT
    SV -.-> DISOT
    
    style ROOT fill:#f3e5f5,stroke:#6a1b9a,stroke-width:3px
```

## Service Interfaces

### Interface Definitions

```mermaid
classDiagram
    class IContentStorage {
        <<interface>>
        +store(content: Content): Promise~ContentHash~
        +retrieve(hash: ContentHash): Promise~Content~
        +exists(hash: ContentHash): Promise~boolean~
        +getAllContent(): Promise~ContentWithHash[]~
    }
    
    class IHashService {
        <<interface>>
        +hash(data: Uint8Array): Promise~string~
    }
    
    class ISignatureService {
        <<interface>>
        +generateKeyPair(): KeyPair
        +sign(data: Uint8Array, privateKey: string): Promise~Signature~
        +verify(data: Uint8Array, signature: Signature): Promise~boolean~
    }
    
    class IStorageProvider {
        <<interface>>
        +read(path: string): Promise~Uint8Array~
        +write(path: string, data: Uint8Array): Promise~void~
        +exists(path: string): Promise~boolean~
        +list(): Promise~string[]~
        +delete(path: string): Promise~void~
    }
    
    class IDisotService {
        <<interface>>
        +createEntry(hash: ContentHash, type: string, key: string): Promise~DisotEntry~
        +getEntry(id: string): Promise~DisotEntry~
        +verifyEntry(entry: DisotEntry): Promise~boolean~
    }
```

### Interface Segregation

```mermaid
graph TD
    subgraph "Large Interface (Bad)"
        BIG[IStorageService<br/>read()<br/>write()<br/>delete()<br/>list()<br/>encrypt()<br/>compress()<br/>backup()]
    end
    
    subgraph "Segregated Interfaces (Good)"
        STORAGE[IStorageProvider<br/>read()<br/>write()<br/>exists()]
        LIST[IListProvider<br/>list()<br/>delete()]
        CRYPTO[ICryptoProvider<br/>encrypt()<br/>decrypt()]
        UTIL[IUtilityProvider<br/>compress()<br/>backup()]
    end
    
    BIG -.->|Refactor| STORAGE
    BIG -.->|Refactor| LIST
    BIG -.->|Refactor| CRYPTO
    BIG -.->|Refactor| UTIL
    
    style BIG fill:#ffcdd2,stroke:#c62828
    style STORAGE fill:#c8e6c9,stroke:#1b5e20
```

## Service Implementation

### CAS Service Implementation

```mermaid
sequenceDiagram
    participant Client
    participant CAS as CasService
    participant Hash as HashService
    participant Storage as StorageService
    
    Note over CAS: store(content: Content)
    
    Client->>CAS: store(content)
    CAS->>Hash: hash(content.data)
    Hash-->>CAS: hashValue
    
    CAS->>CAS: Create ContentHash object
    CAS->>CAS: Generate storage path
    
    CAS->>Storage: exists(path)
    alt Content doesn't exist
        Storage-->>CAS: false
        CAS->>Storage: write(path, data)
        Storage-->>CAS: success
    else Content exists
        Storage-->>CAS: true
        Note over CAS: Skip write (deduped)
    end
    
    CAS-->>Client: ContentHash
```

### DISOT Service Implementation

```mermaid
graph TD
    subgraph "Create Entry Flow"
        INPUT[Input: hash, type, key]
        TIMESTAMP[Generate Timestamp]
        BUILD[Build Entry Data]
        HASH[Hash Entry Data]
        SIGN[Sign with Private Key]
        ASSEMBLE[Assemble Entry]
        STORE[Store in CAS]
        RETURN[Return Entry]
    end
    
    INPUT --> TIMESTAMP
    TIMESTAMP --> BUILD
    BUILD --> HASH
    HASH --> SIGN
    SIGN --> ASSEMBLE
    ASSEMBLE --> STORE
    STORE --> RETURN
    
    style INPUT fill:#e3f2fd,stroke:#1565c0
    style SIGN fill:#f3e5f5,stroke:#6a1b9a
    style RETURN fill:#c8e6c9,stroke:#1b5e20
```

### Service Method Patterns

```mermaid
graph LR
    subgraph "Method Pattern"
        VALIDATE[Validate Input]
        PROCESS[Process Logic]
        HANDLE[Handle Errors]
        RETURN[Return Result]
    end
    
    subgraph "Error Handling"
        TRY[Try Block]
        CATCH[Catch Block]
        LOG[Log Error]
        THROW[Throw/Return Error]
    end
    
    subgraph "Async Pattern"
        PROMISE[Return Promise]
        ASYNC[Async/Await]
        RESOLVE[Resolve Value]
        REJECT[Reject Error]
    end
    
    VALIDATE --> PROCESS
    PROCESS --> HANDLE
    HANDLE --> RETURN
    
    TRY --> CATCH
    CATCH --> LOG
    LOG --> THROW
    
    ASYNC --> PROMISE
    PROMISE --> RESOLVE
    PROMISE --> REJECT
```

## Service Testing

### Testing Strategy

```mermaid
graph TD
    subgraph "Test Types"
        UNIT[Unit Tests<br/>Isolated service testing]
        INTEGRATION[Integration Tests<br/>Service interactions]
        E2E[E2E Tests<br/>Full workflow]
    end
    
    subgraph "Test Utilities"
        MOCK[Mock Dependencies]
        SPY[Spy on Methods]
        STUB[Stub Responses]
    end
    
    subgraph "Test Coverage"
        HAPPY[Happy Path]
        ERROR[Error Cases]
        EDGE[Edge Cases]
    end
    
    UNIT --> MOCK
    INTEGRATION --> SPY
    E2E --> STUB
    
    UNIT --> HAPPY
    UNIT --> ERROR
    UNIT --> EDGE
    
    style UNIT fill:#c8e6c9,stroke:#1b5e20
    style MOCK fill:#e3f2fd,stroke:#1565c0
```

### Service Test Structure

```mermaid
sequenceDiagram
    participant Test
    participant Service
    participant Mock
    
    Note over Test: beforeEach()
    Test->>Test: Create TestBed
    Test->>Test: Inject service
    Test->>Mock: Create mocks
    
    Note over Test: it('should...')
    Test->>Service: Call method
    Service->>Mock: Use dependency
    Mock-->>Service: Return mock data
    Service-->>Test: Return result
    
    Test->>Test: Assert expectations
    Test->>Mock: Verify calls
```

### Mock Service Pattern

```mermaid
classDiagram
    class HashService {
        +hash(data: Uint8Array): Promise~string~
    }
    
    class MockHashService {
        +hash(data: Uint8Array): Promise~string~
        +hashSpy: jasmine.Spy
    }
    
    class TestBed {
        +configureTestingModule(config)
        +inject(token): T
    }
    
    class CasServiceTest {
        -casService: CasService
        -mockHashService: MockHashService
        +beforeEach(): void
        +testStore(): void
    }
    
    HashService <|-- MockHashService
    CasServiceTest --> TestBed
    CasServiceTest --> MockHashService
    CasServiceTest --> CasService
```

### Test Coverage Matrix

```mermaid
graph TD
    subgraph "CAS Service Tests"
        CAS_STORE[store() - 5 tests]
        CAS_RETRIEVE[retrieve() - 4 tests]
        CAS_LIST[getAllContent() - 3 tests]
    end
    
    subgraph "DISOT Service Tests"
        DISOT_CREATE[createEntry() - 6 tests]
        DISOT_GET[getEntry() - 4 tests]
        DISOT_VERIFY[verifyEntry() - 5 tests]
    end
    
    subgraph "Infrastructure Tests"
        HASH_TEST[HashService - 3 tests]
        SIG_TEST[SignatureService - 8 tests]
        STOR_TEST[StorageService - 5 tests]
    end
    
    style CAS_STORE fill:#c8e6c9,stroke:#1b5e20
    style DISOT_CREATE fill:#c8e6c9,stroke:#1b5e20
    style HASH_TEST fill:#c8e6c9,stroke:#1b5e20
```

### Dependency Injection Testing

```mermaid
graph LR
    subgraph "Production"
        PROD_SVC[Real Service]
        PROD_DEP[Real Dependencies]
    end
    
    subgraph "Testing"
        TEST_SVC[Service Under Test]
        TEST_DEP[Mock Dependencies]
    end
    
    subgraph "TestBed Configuration"
        PROVIDERS[providers: [{<br/>provide: HashService,<br/>useClass: MockHashService<br/>}]]
    end
    
    PROD_SVC --> PROD_DEP
    TEST_SVC --> TEST_DEP
    PROVIDERS --> TEST_DEP
    
    style PROD_SVC fill:#ffcdd2,stroke:#c62828
    style TEST_SVC fill:#c8e6c9,stroke:#1b5e20
```

---

[← Component Architecture](./component-architecture.md) | [↑ Top](#service-architecture) | [Home](../README.md) | [Next: Security Architecture →](./security.md)