# CAS Angular Application Architecture

## Overview
This application implements a decentralized content management system using Angular, following Clean Architecture principles.

## Core Principles
- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **DRY**: Don't Repeat Yourself
- **KISS**: Keep It Simple, Stupid
- **Clean Code**: Readable, maintainable, and testable code
- **TDD**: Test-Driven Development approach

## Architecture Layers

### 1. Domain Layer
- Pure TypeScript interfaces and entities
- No dependencies on external libraries
- Business rules and domain logic

### 2. Application Layer
- Use cases and application services
- Orchestrates domain objects
- Implements business workflows

### 3. Infrastructure Layer
- CAS implementation
- DISOT implementation
- External service integrations

### 4. Presentation Layer
- Angular components
- UI logic and state management
- User interaction handling

## Key Components

### Content Addressable Storage (CAS)
- Stores data blocks using SHA256 hash
- Immutable data storage
- Content retrieval by hash

### DISOT (Decentralized Immutable Source of Truth)
- Manages signatures and verification
- Supports multiple data formats
- Uses Secp256k1 cryptography