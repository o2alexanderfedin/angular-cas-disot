# Component Reference

[← Models API](../api/models.md) | [Home](../README.md) | [Next: Content Components →](./content-components.md)

## Table of Contents

1. [Content Components](./content-components.md)
   - [Content Upload Component](./content-components.md#content-upload-component)
   - [Content List Component](./content-components.md#content-list-component)

2. [DISOT Components](./disot-components.md)
   - [DISOT Entry Component](./disot-components.md#disot-entry-component)
   - [Signature Verification Component](./disot-components.md#signature-verification-component)

3. [Layout Components](./layout-components.md)
   - [App Component](./layout-components.md#app-component)
   - [Navigation Component](./layout-components.md#navigation-component)

## Overview

This reference documents all Angular components in the CAS/DISOT application, including their properties, methods, and usage examples.

### Component Architecture

```mermaid
graph TD
    subgraph "Component Hierarchy"
        APP[App Component<br/>Root]
        NAV[Navigation]
        ROUTER[Router Outlet]
    end
    
    subgraph "Feature Components"
        subgraph "Content"
            UPLOAD[Upload Component]
            LIST[List Component]
        end
        
        subgraph "DISOT"
            ENTRY[Entry Component]
            VERIFY[Verify Component]
        end
    end
    
    APP --> NAV
    APP --> ROUTER
    ROUTER --> UPLOAD
    ROUTER --> LIST
    ROUTER --> ENTRY
    ROUTER --> VERIFY
    
    style APP fill:#e1bee7,stroke:#4a148c,stroke-width:3px
    style UPLOAD fill:#e3f2fd,stroke:#1565c0
    style ENTRY fill:#f3e5f5,stroke:#6a1b9a
```

### Component Categories

```mermaid
mindmap
  root((Components))
    Smart Components
      Inject services
      Manage state
      Handle business logic
      Route components
    Presentation Components
      Display only
      Input/Output
      No services
      Reusable
    Layout Components
      App shell
      Navigation
      Footer
      Common UI
```

### Component Communication Patterns

```mermaid
graph LR
    subgraph "Data Flow"
        PARENT[Parent Component]
        CHILD[Child Component]
        SERVICE[Shared Service]
    end
    
    subgraph "Communication Methods"
        INPUT[@Input]
        OUTPUT[@Output]
        OBSERVABLE[Observable]
    end
    
    PARENT -->|Property Binding| INPUT
    INPUT --> CHILD
    CHILD -->|Event Emitter| OUTPUT
    OUTPUT --> PARENT
    
    PARENT --> SERVICE
    CHILD --> SERVICE
    SERVICE -->|BehaviorSubject| OBSERVABLE
    
    style INPUT fill:#e3f2fd,stroke:#1565c0
    style OUTPUT fill:#f3e5f5,stroke:#6a1b9a
    style OBSERVABLE fill:#e8f5e9,stroke:#2e7d32
```

### Component Testing Strategy

```mermaid
graph TD
    subgraph "Test Types"
        UNIT[Unit Tests<br/>Component logic]
        INTEGRATION[Integration Tests<br/>With services]
        E2E[E2E Tests<br/>User workflows]
    end
    
    subgraph "Test Coverage"
        INIT[Initialization]
        INTERACTION[User Interaction]
        ASYNC[Async Operations]
        ERROR[Error Handling]
    end
    
    subgraph "Test Tools"
        KARMA[Karma Runner]
        JASMINE[Jasmine Framework]
        TESTBED[Angular TestBed]
    end
    
    UNIT --> INIT
    INTEGRATION --> ASYNC
    E2E --> INTERACTION
    
    KARMA --> JASMINE
    JASMINE --> TESTBED
    
    style UNIT fill:#c8e6c9,stroke:#1b5e20
    style TESTBED fill:#e3f2fd,stroke:#1565c0
```

---

[← Models API](../api/models.md) | [↑ Top](#component-reference) | [Home](../README.md) | [Next: Content Components →](./content-components.md)