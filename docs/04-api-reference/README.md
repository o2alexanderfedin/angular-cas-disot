# API Reference

[⬅️ Security](../03-developer-guide/architecture/security.md) | [🏠 Documentation Home](../) | [Services ➡️](./services/)

## Table of Contents

1. [Services API](./services/)
   - [CAS Service API](./services/cas-service.md)
   - [DISOT Service API](./services/cas-service.md#disot-service)
   - [Hash Service API](./services/cas-service.md#hash-service)
   - [Signature Service API](./services/cas-service.md#signature-service)
   - [Storage Service API](./services/cas-service.md#storage-service)

2. [Interfaces API](./interfaces/domain-interfaces.md)
   - [Content Interfaces](./interfaces/domain-interfaces.md#content-interfaces)
   - [DISOT Interfaces](./interfaces/domain-interfaces.md#disot-interfaces)
   - [Crypto Interfaces](./interfaces/domain-interfaces.md#crypto-interfaces)
   - [Storage Interfaces](./interfaces/domain-interfaces.md#storage-interfaces)

3. [Models API](./models/content-models.md)
   - [Content Models](./models/content-models.md#content-models)
   - [DISOT Models](./models/content-models.md#disot-models)
   - [Crypto Models](./models/content-models.md#crypto-models)

## Overview

This API reference provides detailed documentation for all services, interfaces, and models in the CAS/DISOT application.

### API Structure

```mermaid
graph TD
    subgraph "Public API"
        SERVICES[Services<br/>Injectable classes]
        INTERFACES[Interfaces<br/>Type contracts]
        MODELS[Models<br/>Data structures]
    end
    
    subgraph "Service Categories"
        CORE[Core Services<br/>CAS, DISOT]
        INFRA[Infrastructure<br/>Hash, Storage, Signature]
    end
    
    subgraph "Interface Categories"
        DOMAIN[Domain Interfaces<br/>Business logic]
        INFRA_INT[Infrastructure Interfaces<br/>Provider contracts]
    end
    
    SERVICES --> CORE
    SERVICES --> INFRA
    INTERFACES --> DOMAIN
    INTERFACES --> INFRA_INT
    
    
    
    
```

### API Conventions

```mermaid
graph TD
    subgraph "Naming Conventions"
        SERVICE[*Service suffix<br/>CasService]
        INTERFACE[I* prefix<br/>IContentStorage]
        MODEL[Plain names<br/>Content, DisotEntry]
    end
    
    subgraph "Method Conventions"
        ASYNC[Async methods<br/>return Promise]
        SYNC[Sync methods<br/>return value]
        VOID[Side effects<br/>return void]
    end
    
    subgraph "Error Handling"
        THROW[Throw Error]
        REJECT[Reject Promise]
        NULL[Return null]
    end
```

### Type System

```mermaid
classDiagram
    class TypeScript {
        <<interface>>
        Strong typing
        Interface contracts
        Generic types
        Union types
    }
    
    class Promise~T~ {
        <<generic>>
        +then(callback): Promise~U~
        +catch(callback): Promise~T~
    }
    
    class Observable~T~ {
        <<generic>>
        +subscribe(observer): Subscription
        +pipe(...operators): Observable~U~
    }
    
    class Result~T~ {
        <<union>>
        T | null | Error
    }
```

---

[⬅️ Security](../03-developer-guide/architecture/security.md) | [⬆️ Top](#api-reference) | [🏠 Documentation Home](../) | [Services ➡️](./services/)