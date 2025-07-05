# Component Architecture

[← Data Flow](./data-flow.md) | [Home](../README.md) | [Next: Service Architecture →](./service-architecture.md)

## Table of Contents

1. [Component Overview](#component-overview)
2. [Component Hierarchy](#component-hierarchy)
3. [Component Communication](#component-communication)
4. [Component Lifecycle](#component-lifecycle)
5. [Component Patterns](#component-patterns)

## Component Overview

### Component Categories

```mermaid
graph TD
    subgraph "Smart Components"
        APP[App Component]
        CL[Content List]
        CU[Content Upload]
        DE[DISOT Entry]
        SV[Signature Verification]
    end
    
    subgraph "Presentation Components"
        FU[File Upload UI]
        LIST[List Display]
        FORM[Entry Form]
        RESULT[Result Display]
    end
    
    subgraph "Shared Components"
        LOAD[Loading Spinner]
        ERROR[Error Display]
        MODAL[Modal Dialog]
    end
    
    APP --> CL
    APP --> CU
    APP --> DE
    APP --> SV
    
    CU --> FU
    CL --> LIST
    DE --> FORM
    SV --> RESULT
    
    CL --> LOAD
    CU --> ERROR
    DE --> MODAL
    
    
    
    
```

## Component Hierarchy

### Application Component Tree

```mermaid
graph TD
    subgraph "Root"
        APP[App Component<br/>selector: app-root]
    end
    
    subgraph "Router Outlet"
        ROUTER[Router Outlet]
    end
    
    subgraph "Feature Components"
        subgraph "Content Features"
            CL[ContentListComponent<br/>route: /content]
            CU[ContentUploadComponent<br/>route: /upload]
        end
        
        subgraph "DISOT Features"
            DE[DisotEntryComponent<br/>route: /disot/create]
            SV[SignatureVerificationComponent<br/>route: /disot/verify]
        end
    end
    
    APP --> ROUTER
    ROUTER --> CL
    ROUTER --> CU
    ROUTER --> DE
    ROUTER --> SV
    
    
    
```

### Component Structure Pattern

```mermaid
classDiagram
    class Component {
        <<abstract>>
        +selector: string
        +templateUrl: string
        +styleUrls: string[]
        +ngOnInit(): void
        +ngOnDestroy(): void
    }
    
    class SmartComponent {
        <<abstract>>
        -services: Service[]
        -subscriptions: Subscription[]
        +loadData(): void
        +handleUserAction(): void
    }
    
    class PresentationComponent {
        <<abstract>>
        +@Input() data: any
        +@Output() action: EventEmitter
        +render(): void
    }
    
    class ContentListComponent {
        -casService: CasService
        +contents: ContentWithHash[]
        +searchTerm: string
        +loadContents(): void
        +downloadContent(hash): void
    }
    
    class FileUploadUI {
        +@Input() isUploading: boolean
        +@Output() fileSelected: EventEmitter
        +onFileChange(event): void
    }
    
    Component <|-- SmartComponent
    Component <|-- PresentationComponent
    SmartComponent <|-- ContentListComponent
    PresentationComponent <|-- FileUploadUI
```

## Component Communication

### Input/Output Flow

```mermaid
graph TD
    subgraph "Parent Component"
        P_DATA[Component Data]
        P_HANDLER[Event Handler]
    end
    
    subgraph "Child Component"
        C_INPUT[@Input Properties]
        C_OUTPUT[@Output Events]
        C_LOGIC[Component Logic]
    end
    
    P_DATA -->|Property Binding| C_INPUT
    C_INPUT --> C_LOGIC
    C_LOGIC --> C_OUTPUT
    C_OUTPUT -->|Event Emission| P_HANDLER
    
    
    
```

### Service-Based Communication

```mermaid
sequenceDiagram
    participant C1 as Component 1
    participant SVC as Shared Service
    participant C2 as Component 2
    
    Note over SVC: BehaviorSubject/Observable
    
    C1->>SVC: Update data
    SVC->>SVC: Store in subject
    SVC-->>C2: Emit via Observable
    C2->>C2: Update UI
    
    C2->>SVC: Request action
    SVC->>SVC: Process request
    SVC-->>C1: Notify via Observable
    C1->>C1: React to change
```

### Router-Based Communication

```mermaid
graph TD
    subgraph "Navigation Flow"
        LIST[List Component]
        ROUTER[Angular Router]
        DETAIL[Detail Component]
    end
    
    subgraph "Route Params"
        PARAMS[Route Parameters]
        QUERY[Query Parameters]
        STATE[Navigation State]
    end
    
    LIST -->|navigate| ROUTER
    ROUTER --> PARAMS
    PARAMS --> DETAIL
    
    DETAIL -->|queryParams| ROUTER
    ROUTER --> QUERY
    QUERY --> LIST
```

## Component Lifecycle

### Lifecycle Hooks Flow

```mermaid
graph TD
    subgraph "Creation Phase"
        CONSTRUCT[constructor]
        INIT[ngOnInit]
    end
    
    subgraph "Update Phase"
        CHANGES[ngOnChanges]
        CHECK[ngDoCheck]
        AFTER_INIT[ngAfterContentInit]
        AFTER_CHECK[ngAfterContentChecked]
        VIEW_INIT[ngAfterViewInit]
        VIEW_CHECK[ngAfterViewChecked]
    end
    
    subgraph "Destruction Phase"
        DESTROY[ngOnDestroy]
    end
    
    CONSTRUCT --> INIT
    INIT --> CHANGES
    CHANGES --> CHECK
    CHECK --> AFTER_INIT
    AFTER_INIT --> AFTER_CHECK
    AFTER_CHECK --> VIEW_INIT
    VIEW_INIT --> VIEW_CHECK
    VIEW_CHECK --> DESTROY
    
    
    
    
```

### Component State Management

```mermaid
stateDiagram-v2
    [*] --> Created: Component Instantiated
    
    Created --> Initialized: ngOnInit()
    
    Initialized --> Active: Data Loaded
    
    Active --> Updating: User Interaction
    Updating --> Active: Update Complete
    
    Active --> Destroying: Navigation/Removal
    
    Destroying --> [*]: ngOnDestroy()
    
    state Active {
        [*] --> Idle
        Idle --> Processing: Action Triggered
        Processing --> Success: Operation Success
        Processing --> Error: Operation Failed
        Success --> Idle
        Error --> Idle: Error Handled
    }
```

## Component Patterns

### Smart vs Presentation Components

```mermaid
graph TD
    subgraph "Smart Component Pattern"
        SC[Smart Component]
        SC_SVC[Injected Services]
        SC_STATE[Manages State]
        SC_LOGIC[Business Logic]
        
        SC --> SC_SVC
        SC --> SC_STATE
        SC --> SC_LOGIC
    end
    
    subgraph "Presentation Component Pattern"
        PC[Presentation Component]
        PC_INPUT[Input Only]
        PC_OUTPUT[Output Events]
        PC_PURE[Pure Functions]
        
        PC --> PC_INPUT
        PC --> PC_OUTPUT
        PC --> PC_PURE
    end
    
    SC -->|Data| PC
    PC -->|Events| SC
    
    
    
```

### Component Composition

```mermaid
graph TD
    subgraph "Content Upload Component"
        UPLOAD[Upload Component]
        
        subgraph "Child Components"
            FILE_SELECT[File Selector]
            PROGRESS[Progress Bar]
            RESULT[Result Display]
        end
        
        subgraph "Services"
            CAS_SVC[CAS Service]
        end
    end
    
    UPLOAD --> FILE_SELECT
    UPLOAD --> PROGRESS
    UPLOAD --> RESULT
    UPLOAD --> CAS_SVC
    
    FILE_SELECT -->|fileSelected| UPLOAD
    UPLOAD -->|progress$| PROGRESS
    UPLOAD -->|result| RESULT
```

### Error Handling Pattern

```mermaid
graph TD
    subgraph "Component Error Handling"
        TRY[Try Operation]
        CATCH[Catch Error]
        LOG[Log Error]
        USER[Notify User]
        RECOVER[Recovery Action]
    end
    
    subgraph "Error Types"
        VALIDATION[Validation Error]
        SERVICE[Service Error]
        NETWORK[Network Error]
    end
    
    TRY --> CATCH
    
    VALIDATION --> CATCH
    SERVICE --> CATCH
    NETWORK --> CATCH
    
    CATCH --> LOG
    LOG --> USER
    USER --> RECOVER
    
    
    
```

### Reactive Forms Pattern

```mermaid
graph TD
    subgraph "Form Structure"
        FORM[FormGroup]
        CONTROLS[FormControls]
        VALIDATORS[Validators]
    end
    
    subgraph "Data Flow"
        MODEL[Data Model]
        VIEW[Template View]
        STREAM[Value Changes]
    end
    
    subgraph "Validation"
        SYNC[Sync Validators]
        ASYNC[Async Validators]
        ERRORS[Error Messages]
    end
    
    FORM --> CONTROLS
    CONTROLS --> VALIDATORS
    
    MODEL --> FORM
    FORM --> VIEW
    VIEW --> STREAM
    STREAM --> MODEL
    
    VALIDATORS --> SYNC
    VALIDATORS --> ASYNC
    SYNC --> ERRORS
    ASYNC --> ERRORS
    
    
    
```

### Component Testing Pattern

```mermaid
graph TD
    subgraph "Test Structure"
        SETUP[Test Setup]
        FIXTURE[Component Fixture]
        INSTANCE[Component Instance]
        DEBUG[Debug Element]
    end
    
    subgraph "Test Types"
        UNIT[Unit Tests]
        INTEGRATION[Integration Tests]
        E2E[E2E Tests]
    end
    
    subgraph "Test Utilities"
        MOCK[Mock Services]
        SPY[Jasmine Spies]
        ASYNC[Async Helpers]
    end
    
    SETUP --> FIXTURE
    FIXTURE --> INSTANCE
    FIXTURE --> DEBUG
    
    UNIT --> MOCK
    INTEGRATION --> SPY
    E2E --> ASYNC
    
    
    
```

---

[← Data Flow](./data-flow.md) | [↑ Top](#component-architecture) | [Home](../README.md) | [Next: Service Architecture →](./service-architecture.md)