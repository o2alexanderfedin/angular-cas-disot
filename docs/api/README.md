# API Reference

[← Security Architecture](../architecture/security.md) | [Home](../README.md) | [Next: Services API →](./services.md)

## Table of Contents

1. [Services API](./services.md)
   - [CAS Service API](./services.md#cas-service)
   - [DISOT Service API](./services.md#disot-service)
   - [Hash Service API](./services.md#hash-service)
   - [Signature Service API](./services.md#signature-service)
   - [Storage Service API](./services.md#storage-service)

2. [Interfaces API](./interfaces.md)
   - [Content Interfaces](./interfaces.md#content-interfaces)
   - [DISOT Interfaces](./interfaces.md#disot-interfaces)
   - [Crypto Interfaces](./interfaces.md#crypto-interfaces)
   - [Storage Interfaces](./interfaces.md#storage-interfaces)

3. [Models API](./models.md)
   - [Content Models](./models.md#content-models)
   - [DISOT Models](./models.md#disot-models)
   - [Crypto Models](./models.md#crypto-models)

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

[← Security Architecture](../architecture/security.md) | [↑ Top](#api-reference) | [Home](../README.md) | [Next: Services API →](./services.md)