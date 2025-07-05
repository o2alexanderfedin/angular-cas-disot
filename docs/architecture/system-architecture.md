# System Architecture 🏛️

[← Architecture Overview](./overview.md) | [Home](../README.md) | [Next: Data Flow →](./data-flow.md)

## Table of Contents

1. [System Overview](#system-overview)
2. [Architectural Patterns](#architectural-patterns)
3. [Module Structure](#module-structure)
4. [Dependency Graph](#dependency-graph)
5. [Deployment Architecture](#deployment-architecture)

## System Overview

### CAS/DISOT Application Context 🌐

```mermaid
graph LR
    subgraph "Users"
        USER[👤 Content Creator<br/>Uploads files<br/>Creates DISOT entries]
    end
    
    subgraph "CAS/DISOT System"
        UPLOAD[📤 File Upload]
        HASH[#️⃣ SHA-256 Hashing]
        STORE[💾 Content Storage]
        DISOT[📝 DISOT Entries]
        VERIFY[✅ Signature Verification]
    end
    
    subgraph "Browser APIs"
        CRYPTO[🔐 Web Crypto API]
        IDB[🗄️ IndexedDB]
        MEM[💭 Memory Storage]
    end
    
    USER --> UPLOAD
    UPLOAD --> HASH
    HASH --> STORE
    STORE --> DISOT
    DISOT --> VERIFY
    
    HASH --> CRYPTO
    STORE --> IDB
    STORE --> MEM
```

## Architectural Patterns

### Clean Architecture in Practice 🎯

```mermaid
graph TD
    subgraph "🎨 UI Layer (Components)"
        UPLOAD_C[ContentUploadComponent]
        LIST_C[ContentListComponent]
        DISOT_C[DisotEntryComponent]
        MODAL_C[ContentSelectionModal]
    end
    
    subgraph "⚙️ Business Logic (Services)"
        CAS_S[CasService]
        DISOT_S[DisotService]
    end
    
    subgraph "🔧 Infrastructure"
        HASH_I[HashService]
        SIG_I[SignatureService]
        STOR_I[Storage Providers]
    end
    
    subgraph "📋 Domain Models"
        CONTENT[Content]
        CHASH[ContentHash]
        ENTRY[DisotEntry]
    end
    
    UPLOAD_C --> CAS_S
    LIST_C --> CAS_S
    DISOT_C --> DISOT_S
    MODAL_C --> CAS_S
    
    CAS_S --> CONTENT
    DISOT_S --> ENTRY
    
    CAS_S --> HASH_I
    CAS_S --> STOR_I
    DISOT_S --> SIG_I
```

### Dependency Injection Flow 💉

```mermaid
graph TD
    subgraph "Angular DI Container"
        ROOT[Root Injector]
    end
    
    subgraph "Service Registration"
        CAS["@Injectable({providedIn: 'root'})<br/>CasService"]
        DISOT["@Injectable({providedIn: 'root'})<br/>DisotService"]
        HASH["@Injectable({providedIn: 'root'})<br/>HashService"]
    end
    
    subgraph "Component Injection"
        COMP["constructor(<br/>  private cas: CasService,<br/>  private disot: DisotService<br/>)"]
    end
    
    subgraph "Factory Pattern"
        FACTORY[StorageProviderFactory]
        TOKEN[STORAGE_TYPE token]
        PROVIDER[Returns IStorageProvider]
    end
    
    ROOT --> CAS
    ROOT --> DISOT
    ROOT --> HASH
    
    CAS --> COMP
    DISOT --> COMP
    
    TOKEN --> FACTORY
    FACTORY --> PROVIDER
```

## Module Structure

### Actual Project Structure 📁

```mermaid
graph TD
    subgraph "src/app/"
        APP[app.component.ts<br/>app.routes.ts]
    end
    
    subgraph "core/"
        DOMAIN[domain/interfaces/<br/>• content.interface.ts<br/>• crypto.interface.ts<br/>• disot.interface.ts]
        SERVICES[services/<br/>• cas.service.ts<br/>• disot.service.ts<br/>• hash.service.ts<br/>• signature.service.ts<br/>• storage.service.ts]
    end
    
    subgraph "features/"
        CONTENT[content/<br/>• content-list/<br/>• content-upload/]
        DISOT[disot/<br/>• disot-entry/<br/>• signature-verification/]
    end
    
    subgraph "shared/"
        SHARED[components/<br/>• content-selection-modal/]
        MODULE[shared-module.ts]
    end
    
    APP --> CONTENT
    APP --> DISOT
    CONTENT --> SERVICES
    DISOT --> SERVICES
    SERVICES --> DOMAIN
    CONTENT --> SHARED
    DISOT --> SHARED
```

### Component Routing Structure 🗺️

```mermaid
graph TD
    subgraph "App Routes"
        HOME[/ → ContentListComponent]
        UPLOAD[/upload → ContentUploadComponent]
        DISOT[/disot → DisotEntryComponent]
        VERIFY[/verify → SignatureVerificationComponent]
        SETTINGS[/settings → SettingsComponent]
    end
    
    subgraph "Navigation Flow"
        NAV[Navigation Bar]
        NAV --> HOME
        NAV --> UPLOAD
        NAV --> DISOT
        NAV --> VERIFY
        NAV --> SETTINGS
    end
    
    subgraph "Modal Navigation"
        DISOT_PAGE[DISOT Entry Page]
        MODAL[Content Selection Modal]
        DISOT_PAGE --> |Open Modal| MODAL
        MODAL --> |Select Content| DISOT_PAGE
    end
```

## Dependency Graph

### Service Dependencies in Action 🔗

```mermaid
graph TD
    subgraph "Components & Their Dependencies"
        UPLOAD[📤 ContentUploadComponent<br/>Injects: CasService]
        LIST[📋 ContentListComponent<br/>Injects: CasService]
        DISOT[✍️ DisotEntryComponent<br/>Injects: DisotService, CasService, SignatureService]
        VERIFY[✅ SignatureVerificationComponent<br/>Injects: DisotService]
        MODAL[🔍 ContentSelectionModal<br/>Injects: CasService]
    end
    
    subgraph "Service Dependency Chain"
        CAS[CasService<br/>Uses: HashService, StorageProvider]
        DISOT_S[DisotService<br/>Uses: CasService, SignatureService, HashService]
    end
    
    UPLOAD --> CAS
    LIST --> CAS
    DISOT --> DISOT_S
    DISOT --> CAS
    VERIFY --> DISOT_S
    MODAL --> CAS
```

### Storage Provider Selection 💾

```mermaid
graph TD
    subgraph "Storage Options"
        MEM[💭 InMemoryStorage<br/>• Fast access<br/>• No persistence<br/>• Lost on refresh]
        IDB[🗄️ IndexedDbStorage<br/>• Browser persistence<br/>• Survives refresh<br/>• ~50MB limit]
    end
    
    subgraph "Selection Process"
        SETTINGS[⚙️ Settings Page]
        SELECT[User selects storage type]
        FACTORY[StorageProviderFactory]
        INJECT[Inject into CasService]
    end
    
    SETTINGS --> SELECT
    SELECT --> |'memory'| MEM
    SELECT --> |'indexeddb'| IDB
    MEM --> FACTORY
    IDB --> FACTORY
    FACTORY --> INJECT
```

## Deployment Architecture

### Current Browser-Only Architecture 🌐

```mermaid
graph TD
    subgraph "Development"
        DEV[npm start<br/>localhost:4200]
    end
    
    subgraph "Build Process"
        BUILD[npm run build]
        DIST[dist/cas-app/]
    end
    
    subgraph "Browser Runtime"
        SPA[Angular SPA]
        CRYPTO[Web Crypto API<br/>SHA-256 hashing]
        IDB_API[IndexedDB API<br/>Persistent storage]
        FILE[File API<br/>Drag & drop]
    end
    
    subgraph "User Data"
        CONTENT[📄 Uploaded Content]
        ENTRIES[📝 DISOT Entries]
        KEYS[🔑 Key Pairs]
    end
    
    DEV --> BUILD
    BUILD --> DIST
    DIST --> SPA
    
    SPA --> CRYPTO
    SPA --> IDB_API
    SPA --> FILE
    
    IDB_API --> CONTENT
    IDB_API --> ENTRIES
    SPA --> KEYS
```

### Future Decentralized Architecture 🚀

```mermaid
graph TD
    subgraph "Current (v1.1.0)"
        BROWSER[🌐 Browser Only<br/>IndexedDB storage]
    end
    
    subgraph "Future Phases"
        P1[Phase 1: IPFS Integration<br/>Distributed content storage]
        P2[Phase 2: Blockchain<br/>Immutable entry records]
        P3[Phase 3: P2P Network<br/>Full decentralization]
    end
    
    subgraph "Potential Stack"
        IPFS[🌍 IPFS<br/>Content distribution]
        ETH[⛓️ Ethereum<br/>DISOT entries]
        LIBP2P[🔗 libp2p<br/>Peer discovery]
    end
    
    BROWSER --> P1
    P1 --> P2
    P2 --> P3
    
    P1 --> IPFS
    P2 --> ETH
    P3 --> LIBP2P
```

---

[← Architecture Overview](./overview.md) | [↑ Top](#system-architecture) | [Home](../README.md) | [Next: Data Flow →](./data-flow.md)