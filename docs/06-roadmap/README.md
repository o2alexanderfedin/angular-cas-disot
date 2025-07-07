# Roadmap 🗺️

## Overview

The CAS/DISOT roadmap outlines our path toward a fully decentralized, peer-to-peer content management system with self-sovereign identity.

## Development Phases

### ✅ Phase 1: IPFS Integration (Completed in v3.0.0)
**Status**: Implemented

Distributed storage layer using IPFS for content persistence and sharing.

Key Features:
- IPFS and Helia storage providers
- Content migration tools
- Share link generation
- Local caching with distributed backend

[View Phase 1 Documentation](./phases/phase-1-ipfs/)

### ❌ Phase 2: ~~Blockchain Integration~~ (Deprecated)
**Status**: Removed from roadmap

Blockchain integration has been deprecated in favor of a simpler, blockchain-free approach.

[Why we removed blockchain](./phases/phase-2-blockchain/DEPRECATED.md)

### 🚧 Phase 3: P2P Network (Next Priority)
**Status**: Planning

True peer-to-peer capabilities enabling direct browser-to-browser communication.

Key Features:
- WebRTC/libp2p for peer connections
- DID-based peer authentication
- Trust network propagation
- Offline-first synchronization

[View Phase 3 Overview](./phases/phase-3-p2p/)

## Current Focus

### Decentralized Identity Integration
We're implementing a minimalistic, blockchain-free identity system:
- W3C DID specification compliance
- Web of Trust model
- Verifiable Credentials
- Browser-compatible cryptography

[View DID Architecture](../decentralized-identity/)

## Timeline

| Phase | Status | Target | Description |
|-------|--------|--------|-------------|
| Phase 1 | ✅ Complete | v3.0.0 | IPFS distributed storage |
| DID System | 🚧 In Progress | v4.0.0 | Decentralized identity |
| Phase 3 | 📋 Planning | v5.0.0 | P2P network |

## Design Principles

1. **Minimalism**: Only essential features, no overengineering
2. **True Decentralization**: No central authorities or blockchains
3. **User Sovereignty**: Users control their data and identity
4. **Progressive Enhancement**: Features work offline-first
5. **Standards Compliance**: W3C DIDs, IPFS, WebRTC

## Success Metrics

- **Adoption**: Number of active users and stored content
- **Resilience**: System uptime without central servers
- **Performance**: Content retrieval speed vs centralized systems
- **Privacy**: Zero knowledge of user data on any server
- **Interoperability**: Integration with other decentralized systems

## Get Involved

We welcome contributions to help build the decentralized future:

1. **Test Phase 1**: Try IPFS storage and report issues
2. **Review DID Design**: Provide feedback on identity architecture
3. **Contribute Code**: Implement features from the roadmap
4. **Share Ideas**: Suggest improvements and new features

## Vision

Our ultimate goal is to create a content management system that:
- Works without any central servers
- Preserves user privacy and control
- Enables direct peer-to-peer collaboration
- Remains simple and accessible to everyone

---

[🏠 Documentation Home](../)