# Service Architecture 🔧

[← Component Architecture](./component-architecture.md) | [Home](../README.md) | [Next: Security Architecture →](./security.md)

## Table of Contents

1. [Service Overview](#service-overview)
2. [Service Dependencies](#service-dependencies)
3. [Service Interfaces](#service-interfaces)
4. [Service Implementation](#service-implementation)
5. [Service Testing](#service-testing)

## Service Overview

### Actual Service Implementation 📐

```mermaid
graph TD
    subgraph "Core Services (Singleton)"
        CAS[CasService<br/>• store()<br/>• retrieve()<br/>• getAllContent()]
        DISOT[DisotService<br/>• createEntry()<br/>• verifyEntry()<br/>• listEntries()]
    end
    
    subgraph "Infrastructure Services"
        HASH[HashService<br/>• hash() via Web Crypto]
        SIG[SignatureService<br/>• generateKeyPair()<br/>• sign() - Mock]
        MEM[InMemoryStorage<br/>• Map-based storage]
        IDB[IndexedDbStorage<br/>• Persistent storage]
    end
    
    CAS --> HASH
    CAS --> |via Factory| MEM
    CAS --> |via Factory| IDB
    DISOT --> CAS
    DISOT --> SIG
    DISOT --> HASH
```

### Service Responsibilities 📋

```mermaid
graph TD
    subgraph "CasService Methods"
        STORE[store(content)<br/>Returns: ContentHash]
        RETRIEVE[retrieve(hash)<br/>Returns: Content]
        LIST[getAllContent()<br/>Returns: ContentWithHash[]]
        META[getMetadata(hash)<br/>Returns: ContentMetadata]
    end
    
    subgraph "DisotService Methods"
        CREATE[createEntry(hash, type, key)<br/>Returns: DisotEntry]
        VERIFY[verifyEntry(entry)<br/>Returns: boolean]
        LISTENT[listEntries()<br/>Returns: DisotEntry[]]
        GET[getEntry(id)<br/>Returns: DisotEntry]
    end
    
    subgraph "Storage Provider Interface"
        READ[read(path)<br/>write(path, data)<br/>exists(path)<br/>list()<br/>delete(path)]        
    end
```

## Service Dependencies

### Actual Dependency Tree 🌳

```mermaid
graph TD
    subgraph "Components"
        UPLOAD[ContentUploadComponent]
        LIST[ContentListComponent]
        DISOT_COMP[DisotEntryComponent]
        MODAL[ContentSelectionModal]
    end
    
    subgraph "Services (Injected)"
        CAS["CasService<br/>@Injectable<br/>({providedIn: 'root'})"]
        DISOT["DisotService<br/>@Injectable<br/>({providedIn: 'root'})"]
    end
    
    subgraph "Providers"
        FACTORY[StorageProviderFactory<br/>Selects storage type]
        MEM[InMemoryStorage]
        IDB[IndexedDbStorage]
    end
    
    UPLOAD --> CAS
    LIST --> CAS
    DISOT_COMP --> DISOT
    DISOT_COMP --> CAS
    MODAL --> CAS
    
    CAS --> FACTORY
    FACTORY --> MEM
    FACTORY --> IDB
    DISOT --> CAS
```

### Storage Provider Factory Pattern 🏭

```mermaid
graph TD
    subgraph "Factory Configuration"
        TOKEN[STORAGE_TYPE<br/>InjectionToken]
        FACTORY[StorageProviderFactory]
    end
    
    subgraph "Provider Selection"
        SETTING[User Setting<br/>Default: 'memory']
        CHECK[Check Type]
        MEM[Return InMemoryStorage]
        IDB[Return IndexedDbStorage]
    end
    
    TOKEN --> FACTORY
    FACTORY --> CHECK
    SETTING --> CHECK
    CHECK -->|type='memory'| MEM
    CHECK -->|type='indexeddb'| IDB
```

## Service Interfaces

### Core Domain Interfaces 🔌

```mermaid
graph TD
    subgraph "IStorageProvider"
        IMETHODS["read(path): Promise<Uint8Array><br/>write(path, data): Promise<void><br/>exists(path): Promise<boolean><br/>list(): Promise<string[]><br/>delete(path): Promise<void><br/>clear(): Promise<void><br/>getSize(): Promise<number>"]
    end
    
    subgraph "Implementations"
        MEM_IMPL["InMemoryStorage<br/>• Map<string, Uint8Array><br/>• No persistence"]
        IDB_IMPL[IndexedDbStorage<br/>• IndexedDB API<br/>• Persistent storage]
    end
    
    IMETHODS --> MEM_IMPL
    IMETHODS --> IDB_IMPL
```

### Content & DISOT Types 📝

```mermaid
graph TD
    subgraph "ContentHash Type"
        CH[algorithm: 'sha256'<br/>value: string]
    end
    
    subgraph "DisotEntry Type"
        DE[id: string<br/>contentHash: ContentHash<br/>signature: Signature<br/>timestamp: Date<br/>type: DisotEntryType]
    end
    
    subgraph "DisotEntryType Enum"
        TYPES["BLOG_POST = 'blog_post'<br/>DOCUMENT = 'document'<br/>IMAGE = 'image'<br/>SIGNATURE = 'signature'"]
    end
    
    DE --> CH
    DE --> TYPES
```

## Service Implementation

### CAS Service Store Flow 💾

```mermaid
sequenceDiagram
    participant Component
    participant CasService
    participant HashService
    participant StorageProvider
    
    Component->>CasService: store(content)
    CasService->>HashService: hash(content.data)
    HashService->>HashService: crypto.subtle.digest('SHA-256')
    HashService-->>CasService: hashValue
    
    CasService->>CasService: path = `content/${hashValue}`
    
    CasService->>StorageProvider: exists(path)
    alt New Content
        StorageProvider-->>CasService: false
        CasService->>StorageProvider: write(path, data)
        CasService->>StorageProvider: write(metadata_path, metadata)
    else Duplicate Content
        StorageProvider-->>CasService: true
        Note over CasService: ✅ Deduplication!
    end
    
    CasService-->>Component: "ContentHash{algorithm, value}"
```

### DISOT Entry Creation Flow ✍️

```mermaid
graph TD
    subgraph "Blog Post Creation"
        BLOG[User writes blog post]
        STORE_BLOG[Store blog content via CAS]
        GET_HASH[Get content hash]
    end
    
    subgraph "Entry Creation"
        INPUT[contentHash + type + privateKey]
        TIMESTAMP[timestamp = new Date()]
        BUILD[entryData = {hash, timestamp, type}]
        HASH_ENTRY[Hash the entry data]
        SIGN[Sign hash with private key]
        CREATE[Create DisotEntry object]
    end
    
    subgraph "Storage"
        STORE_ENTRY[Store entry in entries map]
        RETURN[Return DisotEntry]
    end
    
    BLOG --> STORE_BLOG
    STORE_BLOG --> GET_HASH
    GET_HASH --> INPUT
    INPUT --> TIMESTAMP
    TIMESTAMP --> BUILD
    BUILD --> HASH_ENTRY
    HASH_ENTRY --> SIGN
    SIGN --> CREATE
    CREATE --> STORE_ENTRY
    STORE_ENTRY --> RETURN
```

### IndexedDB Initialization 🗄️

```mermaid
graph TD
    subgraph "IndexedDB Setup"
        OPEN[indexedDB.open('cas-storage', 1)]
        UPGRADE[onupgradeneeded]
        CREATE[createObjectStore('content')]
        SUCCESS[onsuccess]
        ERROR[onerror]
    end
    
    subgraph "Error Handling"
        INIT_ERR[Store initialization error]
        ENSURE[ensureDb() checks]
        RETRY[Retry if needed]
        THROW_ERR[Throw if persistent]
    end
    
    OPEN --> UPGRADE
    UPGRADE --> CREATE
    CREATE --> SUCCESS
    OPEN --> ERROR
    ERROR --> INIT_ERR
    INIT_ERR --> ENSURE
    ENSURE --> RETRY
    RETRY --> THROW_ERR
```

## Service Testing

### Test Coverage Stats 📊

```mermaid
graph TD
    subgraph "Test Results (108 tests)"
        CAS_TESTS[CasService: 12 tests ✅]
        DISOT_TESTS[DisotService: 15 tests ✅]
        HASH_TESTS[HashService: 3 tests ✅]
        SIG_TESTS[SignatureService: 8 tests ✅]
        MEM_TESTS[InMemoryStorage: 7 tests ✅]
        IDB_TESTS[IndexedDbStorage: 8 tests ✅]
        COMP_TESTS[Components: 55 tests ✅]
    end
    
    subgraph "Test Patterns Used"
        MOCK[jasmine.createSpyObj]
        ASYNC[async/await testing]
        PROMISE[Promise handling]
        ERROR[Error case testing]
    end
```

### Actual Test Example 🧪

```mermaid
sequenceDiagram
    participant Test as DisotEntryComponent.spec
    participant Component
    participant CasService
    participant DisotService
    
    Note over Test: it('should create blog post entry')
    Test->>Component: Set blogPostContent
    Test->>Component: createEntry()
    
    Component->>CasService: store(blogData)
    CasService-->>Component: ContentHash
    
    Component->>DisotService: createEntry(hash, BLOG_POST, key)
    DisotService-->>Component: DisotEntry
    
    Test->>Test: expect(casService.store).toHaveBeenCalled()
    Test->>Test: expect(entry.type).toBe(BLOG_POST)
```

### Key Test Scenarios 🎯

```mermaid
graph TD
    subgraph "Content Storage Tests"
        T1[Upload file → Get hash]
        T2[Store duplicate → Deduplication works]
        T3[Retrieve by hash → Get content]
        T4[List all → Returns array]
    end
    
    subgraph "DISOT Entry Tests"
        T5[Create blog post → Stores content first]
        T6[Sign entry → Verify signature]
        T7[List entries → Returns all]
        T8[Invalid key → Error handling]
    end
    
    subgraph "IndexedDB Tests"
        T9[Init DB → Creates store]
        T10[Write/Read → Persistence]
        T11[Clear → Removes all]
        T12[Init error → Proper handling]
    end
```

### Component Integration Tests 🔄

```mermaid
graph TD
    subgraph "ContentSelectionModal Tests"
        M1[Opens modal]
        M2[Shows content list]
        M3[Filters content]
        M4[Previews content]
        M5[Selects & closes]
    end
    
    subgraph "DisotEntry Integration"
        D1[Generate keypair]
        D2[Select content via modal]
        D3[Create blog post]
        D4[Sign & store entry]
        D5[Display previous entries]
    end
    
    M5 --> D2
    D3 --> D4
```

---

[← Component Architecture](./component-architecture.md) | [↑ Top](#service-architecture) | [Home](../README.md) | [Next: Security Architecture →](./security.md)