# Data Flow Architecture

[← System Architecture](./system-architecture.md) | [Home](../README.md) | [Next: Component Architecture →](./component-architecture.md)

## Table of Contents

1. [Content Upload Flow](#content-upload-flow)
2. [Content Retrieval Flow](#content-retrieval-flow)
3. [DISOT Entry Creation](#disot-entry-creation)
4. [Signature Verification Flow](#signature-verification-flow)
5. [State Management](#state-management)

## Content Upload Flow

### Upload Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Upload Component
    participant CAS as CAS Service
    participant HASH as Hash Service
    participant STOR as Storage Service
    
    U->>UI: Select file
    UI->>UI: Read file content
    UI->>CAS: store(content)
    CAS->>HASH: hash(data)
    HASH-->>CAS: SHA-256 hash
    CAS->>CAS: Generate path from hash
    CAS->>STOR: exists(path)
    
    alt Content doesn't exist
        STOR-->>CAS: false
        CAS->>STOR: write(path, data)
        STOR-->>CAS: success
    else Content exists
        STOR-->>CAS: true
        Note over CAS: Skip write (deduplication)
    end
    
    CAS-->>UI: ContentHash
    UI-->>U: Display success
```

### Upload Data Flow Diagram

```mermaid
graph LR
    subgraph "Input"
        FILE[File Input]
        META[Metadata]
    end
    
    subgraph "Processing"
        READ[Read File]
        HASH[Generate Hash]
        STORE[Store Content]
    end
    
    subgraph "Output"
        HASH_ID[Content Hash]
        STATUS[Upload Status]
    end
    
    FILE --> READ
    META --> READ
    READ --> HASH
    HASH --> STORE
    STORE --> HASH_ID
    STORE --> STATUS
    
    style FILE fill:#e3f2fd,stroke:#1565c0
    style HASH fill:#f3e5f5,stroke:#6a1b9a
    style HASH_ID fill:#e8f5e9,stroke:#2e7d32
```

## Content Retrieval Flow

### Retrieval Sequence Diagram

```mermaid
sequenceDiagram
    participant U as User
    participant UI as List Component
    participant CAS as CAS Service
    participant STOR as Storage Service
    
    U->>UI: View content list
    UI->>CAS: getAllContent()
    CAS->>STOR: list all paths
    STOR-->>CAS: path array
    
    loop For each path
        CAS->>STOR: read(path)
        STOR-->>CAS: content data
        CAS->>CAS: Extract hash from path
        CAS->>CAS: Create ContentWithHash
    end
    
    CAS-->>UI: ContentWithHash[]
    UI-->>U: Display content list
    
    U->>UI: Download content
    UI->>CAS: retrieve(hash)
    CAS->>CAS: Generate path from hash
    CAS->>STOR: read(path)
    STOR-->>CAS: content data
    CAS-->>UI: Content
    UI-->>U: Download file
```

### Content List Data Flow

```mermaid
graph TD
    subgraph "Storage Layer"
        PATHS[Stored Paths]
        DATA[Content Data]
    end
    
    subgraph "Service Layer"
        LIST[List Contents]
        RETRIEVE[Retrieve Content]
        TRANSFORM[Transform Data]
    end
    
    subgraph "UI Layer"
        DISPLAY[Display List]
        PREVIEW[Show Preview]
        DOWNLOAD[Enable Download]
    end
    
    PATHS --> LIST
    DATA --> RETRIEVE
    LIST --> TRANSFORM
    RETRIEVE --> TRANSFORM
    TRANSFORM --> DISPLAY
    DISPLAY --> PREVIEW
    DISPLAY --> DOWNLOAD
    
    style PATHS fill:#fff3e0,stroke:#e65100
    style TRANSFORM fill:#e8eaf6,stroke:#3f51b5
    style DISPLAY fill:#fce4ec,stroke:#880e4f
```

## DISOT Entry Creation

### Entry Creation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Entry Component
    participant DISOT as DISOT Service
    participant CAS as CAS Service
    participant SIG as Signature Service
    participant HASH as Hash Service
    
    U->>UI: Create new entry
    UI->>UI: Generate key pair
    UI->>UI: Select content & type
    
    U->>UI: Submit entry
    UI->>CAS: store(content)
    CAS-->>UI: contentHash
    
    UI->>DISOT: createEntry(contentHash, type, privateKey)
    DISOT->>DISOT: Create timestamp
    DISOT->>DISOT: Build entry data
    DISOT->>HASH: hash(entryData)
    HASH-->>DISOT: entry hash
    DISOT->>SIG: sign(entryData, privateKey)
    SIG-->>DISOT: signature
    
    DISOT->>DISOT: Assemble DisotEntry
    DISOT->>CAS: store(serialized entry)
    CAS-->>DISOT: entry storage hash
    
    DISOT-->>UI: DisotEntry
    UI-->>U: Display entry ID
```

### Entry Data Structure Flow

```mermaid
graph TD
    subgraph "Input Data"
        CONTENT[Content Hash]
        TYPE[Entry Type]
        KEYS[Key Pair]
    end
    
    subgraph "Entry Assembly"
        TS[Add Timestamp]
        SIGN[Generate Signature]
        ID[Generate Entry ID]
    end
    
    subgraph "DISOT Entry"
        ENTRY[Complete Entry]
        SERIAL[Serialized Entry]
    end
    
    subgraph "Storage"
        STORE[Store in CAS]
        RETRIEVE[Retrievable by ID]
    end
    
    CONTENT --> TS
    TYPE --> TS
    KEYS --> SIGN
    TS --> SIGN
    SIGN --> ID
    ID --> ENTRY
    ENTRY --> SERIAL
    SERIAL --> STORE
    STORE --> RETRIEVE
    
    style CONTENT fill:#e3f2fd,stroke:#1565c0
    style ENTRY fill:#f3e5f5,stroke:#6a1b9a
    style STORE fill:#e8f5e9,stroke:#2e7d32
```

## Signature Verification Flow

### Verification Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Verify Component
    participant DISOT as DISOT Service
    participant CAS as CAS Service
    participant SIG as Signature Service
    participant HASH as Hash Service
    
    U->>UI: Enter entry ID
    UI->>DISOT: getEntry(id)
    DISOT->>CAS: retrieve(hash from id)
    CAS-->>DISOT: serialized entry
    DISOT->>DISOT: Deserialize entry
    DISOT-->>UI: DisotEntry
    
    UI->>UI: Display entry details
    U->>UI: Verify signature
    UI->>DISOT: verifyEntry(entry)
    
    DISOT->>DISOT: Reconstruct signed data
    DISOT->>HASH: hash(signed data)
    HASH-->>DISOT: data hash
    DISOT->>SIG: verify(data, signature)
    SIG-->>DISOT: boolean result
    
    DISOT-->>UI: Verification result
    UI-->>U: Display result
```

### Verification Data Flow

```mermaid
graph LR
    subgraph "Input"
        ID[Entry ID]
        ENTRY[DISOT Entry]
    end
    
    subgraph "Verification Process"
        RECONSTRUCT[Reconstruct Data]
        HASH_DATA[Hash Data]
        VERIFY_SIG[Verify Signature]
    end
    
    subgraph "Output"
        VALID[Valid]
        INVALID[Invalid]
        ERROR[Error]
    end
    
    ID --> ENTRY
    ENTRY --> RECONSTRUCT
    RECONSTRUCT --> HASH_DATA
    HASH_DATA --> VERIFY_SIG
    
    VERIFY_SIG --> VALID
    VERIFY_SIG --> INVALID
    VERIFY_SIG --> ERROR
    
    style ID fill:#e3f2fd,stroke:#1565c0
    style VERIFY_SIG fill:#f3e5f5,stroke:#6a1b9a
    style VALID fill:#c8e6c9,stroke:#1b5e20
    style INVALID fill:#ffcdd2,stroke:#c62828
```

## State Management

### Component State Flow

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    Idle --> Loading: User Action
    Loading --> Success: Operation Complete
    Loading --> Error: Operation Failed
    
    Success --> Idle: Reset
    Error --> Idle: Retry/Reset
    
    state Success {
        [*] --> DisplayResult
        DisplayResult --> UpdateUI
        UpdateUI --> [*]
    }
    
    state Error {
        [*] --> ShowError
        ShowError --> LogError
        LogError --> [*]
    }
```

### Data Flow Between Components

```mermaid
graph TD
    subgraph "Shared State"
        CONTENT_CACHE[Content Cache]
        ENTRY_CACHE[Entry Cache]
    end
    
    subgraph "Upload Flow"
        UPLOAD[Upload Component]
        UPLOAD_SVC[Upload Service]
    end
    
    subgraph "List Flow"
        LIST[List Component]
        LIST_SVC[List Service]
    end
    
    subgraph "DISOT Flow"
        DISOT_CREATE[Create Component]
        DISOT_VERIFY[Verify Component]
        DISOT_SVC[DISOT Service]
    end
    
    UPLOAD --> UPLOAD_SVC
    UPLOAD_SVC --> CONTENT_CACHE
    
    LIST --> LIST_SVC
    LIST_SVC --> CONTENT_CACHE
    
    DISOT_CREATE --> DISOT_SVC
    DISOT_VERIFY --> DISOT_SVC
    DISOT_SVC --> ENTRY_CACHE
    DISOT_SVC --> CONTENT_CACHE
    
    style CONTENT_CACHE fill:#e8eaf6,stroke:#3f51b5
    style ENTRY_CACHE fill:#e8eaf6,stroke:#3f51b5
```

### Error Handling Flow

```mermaid
graph TD
    subgraph "Error Sources"
        VALIDATION[Validation Error]
        STORAGE[Storage Error]
        CRYPTO[Crypto Error]
        NETWORK[Network Error]
    end
    
    subgraph "Error Handler"
        CATCH[Catch Error]
        LOG[Log Error]
        TRANSFORM[Transform Error]
    end
    
    subgraph "UI Response"
        NOTIFY[Notify User]
        SUGGEST[Suggest Action]
        RECOVER[Recovery Option]
    end
    
    VALIDATION --> CATCH
    STORAGE --> CATCH
    CRYPTO --> CATCH
    NETWORK --> CATCH
    
    CATCH --> LOG
    LOG --> TRANSFORM
    TRANSFORM --> NOTIFY
    NOTIFY --> SUGGEST
    SUGGEST --> RECOVER
    
    style CATCH fill:#ffcdd2,stroke:#c62828
    style TRANSFORM fill:#fff3e0,stroke:#e65100
    style NOTIFY fill:#fce4ec,stroke:#880e4f
```

---

[← System Architecture](./system-architecture.md) | [↑ Top](#data-flow-architecture) | [Home](../README.md) | [Next: Component Architecture →](./component-architecture.md)