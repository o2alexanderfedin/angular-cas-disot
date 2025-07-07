# libp2p Integration Features 🌍

[⬅️ Features](./README.md) | [🏠 Documentation Home](../../)

## Overview

The libp2p integration provides peer-to-peer networking capabilities for the CAS/DISOT system, enabling direct browser-to-browser communication, distributed content discovery, and resilient data exchange without centralized servers.

## Implementation Status: 📄 Documented & Designed

## Core Features

### 1. P2P Content Discovery Chain

#### Chain of Responsibility Pattern
```typescript
interface ContentSource {
  retrieve(hash: ContentHash): Promise<
    | { succeeded: true; content: Content }
    | { succeeded: false; error: any }
  >;
  setNext(source: ContentSource): void;
}
```

#### Discovery Priority
1. **Local CAS Storage** - Fastest, check first
2. **Direct P2P Peers** - Parallel queries to connected peers
3. **IPFS Network** - Distributed fallback
4. **IPFS Gateway** - Final fallback for public content

### 2. Parallel Peer Queries

#### Custom Race Implementation
```typescript
class P2PPeerSource implements ContentSource {
  async retrieve(hash: ContentHash): Promise<Result> {
    const connections = this.libp2p.getConnections();
    
    // Custom race - only fails when ALL fail
    return new Promise(async (resolve) => {
      let failedCount = 0;
      const totalConnections = connections.length;
      
      connections.forEach(async (connection) => {
        try {
          const content = await this.requestFromPeer(
            connection, hash, abortController.signal
          );
          
          if (content && !abortController.signal.aborted) {
            // First success wins!
            abortController.abort();
            resolve({ succeeded: true, content });
          }
        } catch (error) {
          if (++failedCount === totalConnections) {
            // Only fail when ALL peers fail
            resolve(this.next?.retrieve(hash) || 
                   { succeeded: false, error });
          }
        }
      });
    });
  }
}
```

#### Key Benefits
- Maximum performance through parallelism
- Immediate response on first success
- Bandwidth efficiency via request cancellation
- Graceful degradation through the chain

### 3. Modern libp2p API Integration

#### Connection Management
```typescript
// Get active connections
const connections = libp2p.getConnections();

// Open stream with abort support
const stream = await connection.newStream(
  ['/cas/1.0.0'],
  { signal: abortController.signal }
);
```

#### Stream Handling
```typescript
import { pipe } from 'it-pipe';

const response = await pipe(
  // Send request
  [encode({ type: 'GET_CONTENT', hash })],
  stream,
  // Receive response
  async (source) => {
    for await (const chunk of source) {
      return decode(chunk);
    }
  }
);
```

### 4. WebRTC Browser Support

#### Direct Browser Connections
- No server required for data transfer
- NAT traversal via STUN/TURN
- Automatic fallback to relay servers
- Full duplex communication

#### Connection Process
```mermaid
sequenceDiagram
    participant A as Browser A
    participant R as Relay Server
    participant B as Browser B
    
    A->>R: Make reservation
    B->>R: Dial via relay
    R->>A: Incoming connection
    A<->B: Exchange SDP
    A<->B: Direct P2P connection
    Note over R: Relay no longer needed
```

### 5. Peer Capabilities Exchange

```typescript
interface PeerCapabilities {
  did: string;                    // Decentralized identifier
  ipfsNode: {
    enabled: boolean;
    type: 'kubo' | 'helia' | 'gateway-only';
    publicGateway?: string;
    swarmAddresses?: string[];
  };
  contentIndex: BloomFilter;      // Probabilistic content availability
  bandwidthLimit?: number;
}
```

### 6. Protocol Design

#### Custom CAS Protocol
```typescript
// Register protocol handler
libp2p.handle('/cas/1.0.0', async ({ stream }) => {
  const request = await receiveRequest(stream);
  
  switch (request.type) {
    case 'GET_CONTENT':
      const content = await casService.retrieve(request.hash);
      await sendResponse(stream, { content });
      break;
    case 'LIST_CONTENT':
      const list = await casService.list();
      await sendResponse(stream, { list });
      break;
  }
});
```

### 7. Advanced P2P Features (Planned)

#### Collaborative Pinning
```typescript
interface PinningPolicy {
  autoPinTrustThreshold: number;
  recentAccessWindow: number;
  collaborativePinning: {
    enabled: boolean;
    minPeers: number;      // Min peers to maintain copies
    trustRequired: number; // Trust level required
  };
}
```

#### Private Networks
- Swarm key generation and distribution
- Encrypted peer communication
- Trust-based access control

#### IPFS Pubsub Integration
```typescript
// Real-time content notifications
await ipfs.pubsub.subscribe('cas-updates', (msg) => {
  if (msg.type === 'new-content') {
    p2pClient.broadcast({
      type: 'content-available',
      hash: msg.hash,
      source: msg.from
    });
  }
});
```

### 8. Smart Routing

#### Strategy Pattern for Route Selection
```typescript
interface RoutingStrategy {
  selectSource(
    sources: ContentSource[], 
    request: P2PContentRequest
  ): ContentSource;
}

class PerformanceStrategy implements RoutingStrategy {
  selectSource(sources, request) {
    return sources.sort((a, b) => {
      const scoreA = this.calculateScore(a);
      const scoreB = this.calculateScore(b);
      return scoreB - scoreA;
    })[0];
  }
  
  private calculateScore(source: ContentSource): number {
    let score = 0;
    if (source.type === 'direct-peer') score += 100;
    if (source.hasIPFS) score += 50;
    score += source.trustLevel * 10;
    score -= source.latency / 10;
    return score;
  }
}
```

## Configuration

### P2P Network Configuration
```typescript
interface P2PConfig {
  // Bootstrap nodes for initial connections
  bootstrapNodes: string[];
  
  // Connection limits
  maxConnections: number;
  minConnections: number;
  
  // Protocol settings
  protocols: string[];
  
  // WebRTC configuration
  webrtc: {
    stunServers: string[];
    turnServers?: TurnServer[];
  };
}
```

### Content Request Configuration
```typescript
interface P2PContentRequest {
  contentHash: string;
  requesterId: string;           // DID
  preferredSources: string[];    // ['peer', 'ipfs', 'gateway']
  ttl: number;
  metadata?: {
    privacy: 'public' | 'private';
    size?: number;
    urgency?: 'high' | 'normal' | 'low';
    contentType?: string;
  };
  context?: {
    networkCondition: 'online' | 'offline' | 'limited';
    bandwidth: 'high' | 'low';
    batteryLevel?: 'high' | 'low';
  };
}
```

## Benefits

### 1. **True Decentralization**
- No central servers required
- Peer autonomy
- Censorship resistance
- Network resilience

### 2. **Performance**
- Direct connections (lowest latency)
- Parallel queries
- Smart routing
- Bandwidth optimization

### 3. **Privacy & Security**
- End-to-end encryption
- DID-based authentication
- Private content networks
- Trust-based access

### 4. **Offline Capability**
- Local network discovery
- Opportunistic synchronization
- Offline-first design
- Conflict resolution

## Implementation Roadmap

### Phase 3.1: Basic Integration
- [ ] Basic libp2p setup
- [ ] Simple peer discovery
- [ ] Direct content transfer
- [ ] WebRTC transport

### Phase 3.2: Advanced Features
- [ ] Parallel peer queries
- [ ] Smart routing strategies
- [ ] Private networks
- [ ] Pubsub integration

### Phase 3.3: Optimization
- [ ] Performance tuning
- [ ] Advanced caching
- [ ] Economic incentives
- [ ] Analytics and monitoring

## Development Guidelines

### Protocol Development
1. Use semantic versioning for protocols
2. Maintain backward compatibility
3. Document message formats
4. Implement timeouts

### Error Handling
```typescript
try {
  const content = await p2pSource.retrieve(hash);
} catch (error) {
  if (error.name === 'AbortError') {
    // Request was cancelled
  } else if (error.code === 'ERR_NO_PEERS') {
    // No peers available
  } else {
    // Other errors
  }
}
```

### Testing Approach
1. Unit tests with mock libp2p
2. Integration tests with memory transport
3. E2E tests with real WebRTC
4. Network simulation tests

---

[⬅️ Features](./README.md) | [⬆️ Top](#libp2p-integration-features-) | [🏠 Documentation Home](../../)