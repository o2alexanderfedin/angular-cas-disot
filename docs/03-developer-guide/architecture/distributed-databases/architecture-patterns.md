# Distributed Database Architecture Patterns 🏗️

[⬅️ Distributed Databases](./README.md) | [🏠 Documentation Home](../../../)

## Overview

This document explores proven architecture patterns for building distributed applications in the browser using TypeScript. We'll focus on practical patterns that work well with modern distributed databases and P2P technologies.

## Table of Contents

1. [Core Patterns](#core-patterns)
2. [Data Synchronization Patterns](#data-synchronization-patterns)
3. [Conflict Resolution Patterns](#conflict-resolution-patterns)
4. [Security Patterns](#security-patterns)
5. [Performance Patterns](#performance-patterns)
6. [Hybrid Architecture Patterns](#hybrid-architecture-patterns)

## Core Patterns

### 1. Event Sourcing with CRDTs

Event sourcing combined with CRDTs provides both historical tracking and automatic conflict resolution.

```typescript
import * as Y from 'yjs'

interface Event {
  id: string
  type: string
  payload: any
  timestamp: number
  deviceId: string
}

class EventSourcingCRDT {
  private events: Y.Array<Event>
  private snapshots: Y.Map<any>
  private doc: Y.Doc
  
  constructor() {
    this.doc = new Y.Doc()
    this.events = this.doc.getArray('events')
    this.snapshots = this.doc.getMap('snapshots')
  }
  
  // Append-only event log
  async dispatch(type: string, payload: any) {
    const event: Event = {
      id: crypto.randomUUID(),
      type,
      payload,
      timestamp: Date.now(),
      deviceId: this.getDeviceId()
    }
    
    this.events.push([event])
    
    // Update materialized view
    await this.updateSnapshot(event)
  }
  
  // Rebuild state from events
  async rebuildState(untilTimestamp?: number) {
    const state = {}
    const events = this.events.toArray()
      .filter(e => !untilTimestamp || e.timestamp <= untilTimestamp)
      .sort((a, b) => a.timestamp - b.timestamp)
    
    for (const event of events) {
      await this.applyEvent(state, event)
    }
    
    return state
  }
  
  // Create periodic snapshots
  async createSnapshot() {
    const state = await this.rebuildState()
    const snapshot = {
      state,
      timestamp: Date.now(),
      eventCount: this.events.length
    }
    
    this.snapshots.set(`snapshot-${Date.now()}`, snapshot)
  }
}
```

### 2. Actor Model Pattern

Each entity (user, document, etc.) is an independent actor with its own state and message queue.

```typescript
interface ActorMessage {
  type: string
  payload: any
  from: string
  to: string
  timestamp: number
}

abstract class Actor {
  protected id: string
  protected state: Y.Map<any>
  protected inbox: Y.Array<ActorMessage>
  protected doc: Y.Doc
  
  constructor(id: string) {
    this.id = id
    this.doc = new Y.Doc()
    this.state = this.doc.getMap('state')
    this.inbox = this.doc.getArray('inbox')
    
    // Process messages
    this.inbox.observe(() => this.processMessages())
  }
  
  // Send message to another actor
  async send(to: string, type: string, payload: any) {
    const message: ActorMessage = {
      type,
      payload,
      from: this.id,
      to,
      timestamp: Date.now()
    }
    
    // In real implementation, this would use P2P network
    await this.deliver(to, message)
  }
  
  // Process incoming messages
  private async processMessages() {
    const messages = this.inbox.toArray()
    
    for (const message of messages) {
      if (!this.isProcessed(message)) {
        await this.handleMessage(message)
        this.markProcessed(message)
      }
    }
  }
  
  abstract handleMessage(message: ActorMessage): Promise<void>
}

// Example: User Actor
class UserActor extends Actor {
  async handleMessage(message: ActorMessage) {
    switch (message.type) {
      case 'UPDATE_PROFILE':
        this.state.set('profile', message.payload)
        break
        
      case 'FRIEND_REQUEST':
        const requests = this.state.get('friendRequests') || []
        requests.push(message.from)
        this.state.set('friendRequests', requests)
        break
        
      case 'POST_CREATED':
        // Update feed
        const feed = this.state.get('feed') || []
        feed.push(message.payload)
        this.state.set('feed', feed)
        break
    }
  }
}
```

### 3. Repository Pattern with Multiple Backends

Abstract data access to support multiple storage backends.

```typescript
interface Repository<T> {
  find(id: string): Promise<T | null>
  findAll(filter?: any): Promise<T[]>
  save(entity: T): Promise<void>
  delete(id: string): Promise<void>
  watch(id: string): Observable<T | null>
}

// Yjs implementation
class YjsRepository<T extends { id: string }> implements Repository<T> {
  constructor(
    private collection: Y.Map<T>,
    private doc: Y.Doc
  ) {}
  
  async find(id: string): Promise<T | null> {
    return this.collection.get(id) || null
  }
  
  async findAll(filter?: any): Promise<T[]> {
    const all = Array.from(this.collection.values())
    if (!filter) return all
    
    return all.filter(item => 
      Object.entries(filter).every(([key, value]) => 
        item[key] === value
      )
    )
  }
  
  async save(entity: T): Promise<void> {
    this.doc.transact(() => {
      this.collection.set(entity.id, entity)
    })
  }
  
  async delete(id: string): Promise<void> {
    this.doc.transact(() => {
      this.collection.delete(id)
    })
  }
  
  watch(id: string): Observable<T | null> {
    return new Observable(subscriber => {
      const handler = () => {
        subscriber.next(this.collection.get(id) || null)
      }
      
      this.collection.observe(handler)
      handler() // Initial value
      
      return () => this.collection.unobserve(handler)
    })
  }
}

// RxDB implementation
class RxDBRepository<T> implements Repository<T> {
  constructor(private collection: RxCollection<T>) {}
  
  async find(id: string): Promise<T | null> {
    const doc = await this.collection.findOne(id).exec()
    return doc?.toJSON() || null
  }
  
  async findAll(filter?: any): Promise<T[]> {
    const query = filter 
      ? this.collection.find({ selector: filter })
      : this.collection.find()
    
    const docs = await query.exec()
    return docs.map(doc => doc.toJSON())
  }
  
  async save(entity: T): Promise<void> {
    await this.collection.upsert(entity)
  }
  
  async delete(id: string): Promise<void> {
    const doc = await this.collection.findOne(id).exec()
    if (doc) await doc.remove()
  }
  
  watch(id: string): Observable<T | null> {
    return this.collection.findOne(id).$.pipe(
      map(doc => doc?.toJSON() || null)
    )
  }
}
```

## Data Synchronization Patterns

### 1. Selective Sync Pattern

Sync only relevant data based on context and permissions.

```typescript
interface SyncContext {
  userId: string
  deviceId: string
  permissions: string[]
  interests: string[]
  lastSync: number
}

class SelectiveSync {
  private providers: Map<string, any> = new Map()
  
  constructor(private doc: Y.Doc) {}
  
  // Setup filtered sync
  setupSync(context: SyncContext) {
    // Sync user's own data
    this.syncUserData(context.userId)
    
    // Sync friends' public data
    this.syncFriendsData(context.userId)
    
    // Sync subscribed topics
    context.interests.forEach(topic => {
      this.syncTopic(topic, context)
    })
    
    // Setup bandwidth-aware sync
    this.setupAdaptiveSync(context)
  }
  
  private syncUserData(userId: string) {
    const provider = new WebrtcProvider(
      `user-${userId}`,
      this.doc,
      {
        filterBroadcast: (update, origin) => {
          // Only sync user's own data changes
          const decoder = decoding.createDecoder(update)
          const structs = readStructs(decoder)
          
          return structs.some(struct => 
            struct.id.client === userId
          )
        }
      }
    )
    
    this.providers.set(`user-${userId}`, provider)
  }
  
  private syncTopic(topic: string, context: SyncContext) {
    // Create subdocument for topic
    const topicDoc = this.doc.getSubdoc(topic)
    
    const provider = new WebrtcProvider(
      `topic-${topic}`,
      topicDoc,
      {
        // Only sync if user has permission
        connect: context.permissions.includes(`read:${topic}`),
        
        // Limit sync window
        syncWindow: 7 * 24 * 60 * 60 * 1000 // 7 days
      }
    )
    
    this.providers.set(`topic-${topic}`, provider)
  }
  
  private setupAdaptiveSync(context: SyncContext) {
    // Monitor connection quality
    const monitor = new ConnectionMonitor()
    
    monitor.on('quality-change', (quality) => {
      this.providers.forEach(provider => {
        if (quality === 'poor') {
          // Reduce sync frequency
          provider.syncInterval = 5000
          provider.maxMessageSize = 50000
        } else if (quality === 'good') {
          // Normal sync
          provider.syncInterval = 1000
          provider.maxMessageSize = 500000
        }
      })
    })
  }
}
```

### 2. Hybrid Local/Remote Pattern

Use local-first with optional cloud backup.

```typescript
class HybridStorage {
  private local: Y.Doc
  private remote: CloudStorage
  private syncQueue: Y.Array<SyncOperation>
  
  constructor() {
    this.local = new Y.Doc()
    this.remote = new CloudStorage()
    this.syncQueue = this.local.getArray('syncQueue')
    
    // Setup bidirectional sync
    this.setupSync()
  }
  
  private setupSync() {
    // Local changes to remote
    this.local.on('update', (update, origin) => {
      if (origin !== 'remote') {
        this.queueSync({
          type: 'push',
          update: Y.encodeStateAsUpdate(this.local),
          timestamp: Date.now()
        })
      }
    })
    
    // Periodic sync
    setInterval(() => this.processQueue(), 5000)
    
    // Real-time sync when online
    window.addEventListener('online', () => {
      this.fullSync()
    })
  }
  
  private async processQueue() {
    if (!navigator.onLine) return
    
    const operations = this.syncQueue.toArray()
    
    for (const op of operations) {
      try {
        if (op.type === 'push') {
          await this.remote.push(op.update)
        } else if (op.type === 'pull') {
          const update = await this.remote.pull(op.since)
          Y.applyUpdate(this.local, update, 'remote')
        }
        
        // Remove from queue
        const index = this.syncQueue.toArray().indexOf(op)
        if (index !== -1) {
          this.syncQueue.delete(index, 1)
        }
      } catch (error) {
        console.error('Sync failed:', error)
        // Retry later
      }
    }
  }
  
  async read(key: string): Promise<any> {
    // Always read from local first
    const local = this.local.getMap('data').get(key)
    
    if (local) {
      return local
    }
    
    // Fallback to remote if not found locally
    if (navigator.onLine) {
      const remote = await this.remote.get(key)
      if (remote) {
        // Cache locally
        this.local.getMap('data').set(key, remote)
        return remote
      }
    }
    
    return null
  }
}
```

### 3. Sharding Pattern

Split large datasets across multiple documents.

```typescript
class ShardedDatabase {
  private shards = new Map<string, Y.Doc>()
  private shardIndex: Y.Map<string>
  private shardSize = 10000 // Items per shard
  
  constructor() {
    const indexDoc = new Y.Doc()
    this.shardIndex = indexDoc.getMap('index')
  }
  
  private getShardId(key: string): string {
    // Consistent hashing for shard assignment
    const hash = this.hashCode(key)
    const shardNumber = Math.floor(hash / this.shardSize)
    return `shard-${shardNumber}`
  }
  
  private getShard(shardId: string): Y.Doc {
    if (!this.shards.has(shardId)) {
      const shard = new Y.Doc()
      
      // Setup shard-specific sync
      new WebrtcProvider(shardId, shard)
      new IndexeddbPersistence(shardId, shard)
      
      this.shards.set(shardId, shard)
    }
    
    return this.shards.get(shardId)!
  }
  
  async set(key: string, value: any) {
    const shardId = this.getShardId(key)
    const shard = this.getShard(shardId)
    
    shard.transact(() => {
      shard.getMap('data').set(key, value)
    })
    
    // Update index
    this.shardIndex.set(key, shardId)
  }
  
  async get(key: string): Promise<any> {
    const shardId = this.shardIndex.get(key)
    if (!shardId) return null
    
    const shard = this.getShard(shardId)
    return shard.getMap('data').get(key)
  }
  
  async query(predicate: (value: any) => boolean): Promise<any[]> {
    const results: any[] = []
    
    // Query all shards in parallel
    const promises = Array.from(this.shards.values()).map(shard => {
      return new Promise(resolve => {
        const data = shard.getMap('data')
        const shardResults = Array.from(data.values())
          .filter(predicate)
        resolve(shardResults)
      })
    })
    
    const shardResults = await Promise.all(promises)
    return shardResults.flat()
  }
  
  private hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }
}
```

## Conflict Resolution Patterns

### 1. Three-Way Merge Pattern

Similar to Git, use a common ancestor for conflict resolution.

```typescript
interface Version<T> {
  id: string
  data: T
  parentId?: string
  timestamp: number
  authorId: string
}

class ThreeWayMerge<T> {
  private versions: Map<string, Version<T>> = new Map()
  
  async merge(
    local: Version<T>,
    remote: Version<T>,
    resolver?: ConflictResolver<T>
  ): Promise<Version<T>> {
    // Find common ancestor
    const ancestor = this.findCommonAncestor(local, remote)
    
    if (!ancestor) {
      // No common history, use resolver
      return resolver ? resolver.resolve(local, remote) : local
    }
    
    // Perform three-way merge
    const localChanges = this.diff(ancestor.data, local.data)
    const remoteChanges = this.diff(ancestor.data, remote.data)
    
    const conflicts = this.findConflicts(localChanges, remoteChanges)
    
    if (conflicts.length === 0) {
      // Auto-merge non-conflicting changes
      const merged = this.applyChanges(
        ancestor.data,
        [...localChanges, ...remoteChanges]
      )
      
      return {
        id: crypto.randomUUID(),
        data: merged,
        parentId: local.id, // Could track both parents
        timestamp: Date.now(),
        authorId: 'system'
      }
    } else {
      // Handle conflicts
      if (resolver) {
        return resolver.resolve(local, remote, conflicts)
      }
      
      // Default: last-write-wins
      return local.timestamp > remote.timestamp ? local : remote
    }
  }
  
  private findCommonAncestor(
    v1: Version<T>,
    v2: Version<T>
  ): Version<T> | null {
    const ancestors1 = this.getAncestors(v1)
    const ancestors2 = this.getAncestors(v2)
    
    // Find most recent common ancestor
    for (const a1 of ancestors1) {
      if (ancestors2.some(a2 => a2.id === a1.id)) {
        return a1
      }
    }
    
    return null
  }
}
```

### 2. Operational Transformation Pattern

Transform operations to maintain consistency.

```typescript
interface Operation {
  type: 'insert' | 'delete' | 'update'
  position?: number
  data?: any
  length?: number
  path?: string[]
}

class OperationalTransform {
  // Transform op1 against op2
  transform(op1: Operation, op2: Operation): Operation {
    if (op1.type === 'insert' && op2.type === 'insert') {
      if (op1.position! <= op2.position!) {
        return op1 // No change needed
      } else {
        return {
          ...op1,
          position: op1.position! + op2.data.length
        }
      }
    }
    
    if (op1.type === 'delete' && op2.type === 'insert') {
      if (op1.position! < op2.position!) {
        return op1
      } else {
        return {
          ...op1,
          position: op1.position! + op2.data.length
        }
      }
    }
    
    if (op1.type === 'insert' && op2.type === 'delete') {
      if (op1.position! <= op2.position!) {
        return op1
      } else {
        return {
          ...op1,
          position: Math.max(
            op2.position!,
            op1.position! - op2.length!
          )
        }
      }
    }
    
    // ... handle other cases
    
    return op1
  }
  
  // Apply multiple operations in order
  compose(ops: Operation[]): Operation[] {
    const composed: Operation[] = []
    
    for (const op of ops) {
      if (composed.length === 0) {
        composed.push(op)
      } else {
        // Try to merge with last operation
        const last = composed[composed.length - 1]
        const merged = this.tryMerge(last, op)
        
        if (merged) {
          composed[composed.length - 1] = merged
        } else {
          composed.push(op)
        }
      }
    }
    
    return composed
  }
}
```

## Security Patterns

### 1. End-to-End Encryption Pattern

Encrypt data before it enters the distributed system.

```typescript
import { box, randomBytes } from 'tweetnacl'
import { encode, decode } from '@msgpack/msgpack'

class E2EEncryptedDoc {
  private doc: Y.Doc
  private keys: Map<string, Uint8Array> = new Map()
  
  constructor() {
    this.doc = new Y.Doc()
    
    // Intercept all updates
    this.doc.on('beforeTransaction', (tr) => {
      this.encryptTransaction(tr)
    })
    
    // Decrypt on read
    this.setupDecryption()
  }
  
  private encryptTransaction(transaction: any) {
    transaction.changedParentTypes.forEach((type: Y.AbstractType<any>) => {
      if (type instanceof Y.Map) {
        this.encryptMap(type)
      } else if (type instanceof Y.Array) {
        this.encryptArray(type)
      }
    })
  }
  
  private encryptMap(map: Y.Map<any>) {
    map.forEach((value, key) => {
      if (this.shouldEncrypt(key)) {
        const encrypted = this.encrypt(value)
        map.set(key, encrypted)
      }
    })
  }
  
  private encrypt(data: any): any {
    const message = encode(data)
    const nonce = randomBytes(box.nonceLength)
    const key = this.getEncryptionKey()
    
    const encrypted = box(message, nonce, key.publicKey, key.secretKey)
    
    return {
      _encrypted: true,
      nonce: Array.from(nonce),
      data: Array.from(encrypted)
    }
  }
  
  private decrypt(encrypted: any): any {
    if (!encrypted._encrypted) return encrypted
    
    const nonce = new Uint8Array(encrypted.nonce)
    const data = new Uint8Array(encrypted.data)
    const key = this.getEncryptionKey()
    
    const decrypted = box.open(data, nonce, key.publicKey, key.secretKey)
    if (!decrypted) throw new Error('Decryption failed')
    
    return decode(decrypted)
  }
  
  // Selective encryption based on field names
  private shouldEncrypt(key: string): boolean {
    const sensitiveFields = [
      'password', 'email', 'phone', 'ssn',
      'creditCard', 'privateKey', 'secret'
    ]
    
    return sensitiveFields.some(field => 
      key.toLowerCase().includes(field)
    )
  }
}
```

### 2. Zero-Knowledge Proof Pattern

Verify data without revealing it.

```typescript
interface ZKProof {
  commitment: string
  challenge: string
  response: string
}

class ZeroKnowledgeAuth {
  // Prove knowledge of password without revealing it
  async provePassword(password: string): Promise<ZKProof> {
    // Simplified Schnorr protocol
    const hash = await this.hash(password)
    const secret = BigInt('0x' + hash)
    
    // Commitment phase
    const r = this.randomBigInt()
    const commitment = this.modPow(this.generator, r, this.prime)
    
    // Challenge (would come from verifier in real protocol)
    const challenge = this.randomBigInt()
    
    // Response
    const response = (r + challenge * secret) % (this.prime - 1n)
    
    return {
      commitment: commitment.toString(),
      challenge: challenge.toString(),
      response: response.toString()
    }
  }
  
  async verifyProof(
    proof: ZKProof,
    passwordHash: string
  ): Promise<boolean> {
    const commitment = BigInt(proof.commitment)
    const challenge = BigInt(proof.challenge)
    const response = BigInt(proof.response)
    
    const publicKey = BigInt('0x' + passwordHash)
    
    // Verify: g^response = commitment * publicKey^challenge
    const left = this.modPow(this.generator, response, this.prime)
    const right = (commitment * this.modPow(publicKey, challenge, this.prime)) % this.prime
    
    return left === right
  }
  
  private modPow(base: bigint, exp: bigint, mod: bigint): bigint {
    let result = 1n
    base = base % mod
    
    while (exp > 0) {
      if (exp % 2n === 1n) {
        result = (result * base) % mod
      }
      exp = exp / 2n
      base = (base * base) % mod
    }
    
    return result
  }
}
```

## Performance Patterns

### 1. Lazy Loading Pattern

Load data on-demand to reduce initial payload.

```typescript
class LazyLoadedDatabase {
  private loaded = new Map<string, Y.Doc>()
  private metadata: Y.Map<any>
  
  constructor() {
    // Only load metadata initially
    const metaDoc = new Y.Doc()
    this.metadata = metaDoc.getMap('metadata')
    
    new IndexeddbPersistence('metadata', metaDoc)
  }
  
  async getCollection(name: string): Promise<Y.Map<any>> {
    if (!this.loaded.has(name)) {
      await this.loadCollection(name)
    }
    
    return this.loaded.get(name)!.getMap('data')
  }
  
  private async loadCollection(name: string) {
    const doc = new Y.Doc()
    
    // Load from storage
    const persistence = new IndexeddbPersistence(name, doc)
    await persistence.whenSynced
    
    // Setup sync only when accessed
    const provider = new WebrtcProvider(name, doc, {
      connect: false // Don't connect immediately
    })
    
    // Connect on first write
    doc.on('update', (update, origin) => {
      if (origin === null && !provider.connected) {
        provider.connect()
      }
    })
    
    this.loaded.set(name, doc)
    
    // Update metadata
    this.metadata.set(name, {
      loaded: true,
      lastAccess: Date.now()
    })
    
    // Unload after inactivity
    this.scheduleUnload(name)
  }
  
  private scheduleUnload(name: string) {
    setTimeout(() => {
      const meta = this.metadata.get(name)
      const idle = Date.now() - meta.lastAccess > 300000 // 5 min
      
      if (idle) {
        const doc = this.loaded.get(name)
        doc?.destroy()
        this.loaded.delete(name)
        
        this.metadata.set(name, {
          ...meta,
          loaded: false
        })
      }
    }, 300000)
  }
}
```

### 2. Compression Pattern

Reduce bandwidth and storage usage.

```typescript
import { compress, decompress } from 'lz4js'

class CompressedSync {
  private doc: Y.Doc
  private compressionThreshold = 1024 // 1KB
  
  constructor() {
    this.doc = new Y.Doc()
    this.setupCompression()
  }
  
  private setupCompression() {
    // Compress large updates before sending
    const originalProvider = new WebrtcProvider('room', this.doc)
    
    const send = originalProvider.send.bind(originalProvider)
    originalProvider.send = (message: Uint8Array) => {
      if (message.length > this.compressionThreshold) {
        const compressed = this.compressMessage(message)
        send(compressed)
      } else {
        send(message)
      }
    }
    
    // Decompress received messages
    originalProvider.on('message', (message: Uint8Array) => {
      const decompressed = this.decompressMessage(message)
      // Process decompressed message
    })
  }
  
  private compressMessage(message: Uint8Array): Uint8Array {
    const compressed = compress(message)
    
    // Add header to indicate compression
    const header = new Uint8Array([0xFF, 0xC0]) // Magic bytes
    const result = new Uint8Array(header.length + compressed.length)
    result.set(header)
    result.set(compressed, header.length)
    
    return result
  }
  
  private decompressMessage(message: Uint8Array): Uint8Array {
    // Check for compression header
    if (message[0] === 0xFF && message[1] === 0xC0) {
      return decompress(message.slice(2))
    }
    
    return message
  }
}
```

## Hybrid Architecture Patterns

### 1. CQRS Pattern

Separate read and write models for optimal performance.

```typescript
class CQRSDistributedStore {
  private writeModel: Y.Doc
  private readModel: Dexie
  private eventBus: EventEmitter
  
  constructor() {
    // Write model - CRDT for consistency
    this.writeModel = new Y.Doc()
    
    // Read model - IndexedDB for queries
    this.readModel = new Dexie('readModel')
    this.readModel.version(1).stores({
      users: 'id, username, email, createdAt',
      posts: 'id, authorId, timestamp, [authorId+timestamp]'
    })
    
    this.eventBus = new EventEmitter()
    
    // Project write model to read model
    this.setupProjection()
  }
  
  // Commands (write)
  async createUser(data: CreateUserCommand) {
    const user = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: Date.now()
    }
    
    this.writeModel.transact(() => {
      this.writeModel.getMap('users').set(user.id, user)
    })
    
    this.eventBus.emit('user:created', user)
  }
  
  // Queries (read)
  async findUsersByEmail(email: string) {
    return this.readModel.users
      .where('email')
      .equals(email)
      .toArray()
  }
  
  async getRecentPosts(limit = 50) {
    return this.readModel.posts
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray()
  }
  
  private setupProjection() {
    // Project changes to read model
    this.writeModel.on('update', async () => {
      const users = this.writeModel.getMap('users')
      
      // Batch update read model
      await this.readModel.transaction('rw', 
        this.readModel.users,
        this.readModel.posts,
        async () => {
          // Update users
          for (const [id, user] of users.entries()) {
            await this.readModel.users.put(user)
          }
        }
      )
    })
  }
}
```

### 2. Microservices Pattern

Each feature as an independent service with its own data.

```typescript
interface Service {
  name: string
  initialize(): Promise<void>
  destroy(): Promise<void>
}

class UserService implements Service {
  name = 'users'
  private doc: Y.Doc
  private api: ServiceAPI
  
  async initialize() {
    this.doc = new Y.Doc()
    new WebrtcProvider(`service-${this.name}`, this.doc)
    
    // Expose API
    this.api = {
      createUser: this.createUser.bind(this),
      getUser: this.getUser.bind(this),
      updateUser: this.updateUser.bind(this)
    }
    
    ServiceRegistry.register(this.name, this.api)
  }
  
  async destroy() {
    this.doc.destroy()
    ServiceRegistry.unregister(this.name)
  }
  
  private async createUser(data: any) {
    // Implementation
  }
  
  private async getUser(id: string) {
    return this.doc.getMap('users').get(id)
  }
  
  private async updateUser(id: string, updates: any) {
    // Implementation
  }
}

class ServiceRegistry {
  private static services = new Map<string, ServiceAPI>()
  
  static register(name: string, api: ServiceAPI) {
    this.services.set(name, api)
  }
  
  static get(name: string): ServiceAPI {
    const service = this.services.get(name)
    if (!service) {
      throw new Error(`Service ${name} not found`)
    }
    return service
  }
  
  static async call(
    serviceName: string,
    method: string,
    ...args: any[]
  ) {
    const service = this.get(serviceName)
    return service[method](...args)
  }
}

// Usage
const userService = new UserService()
await userService.initialize()

const user = await ServiceRegistry.call('users', 'getUser', 'user-123')
```

## Best Practices Summary

### Architecture Selection
1. **Event Sourcing** - When you need audit trails
2. **Actor Model** - For complex state machines
3. **Repository Pattern** - For database abstraction
4. **CQRS** - When read/write patterns differ significantly
5. **Microservices** - For team scalability

### Performance Optimization
1. Use **sharding** for datasets > 100k items
2. Implement **lazy loading** for better initial load
3. Apply **compression** for large messages
4. Use **selective sync** to reduce bandwidth

### Security Considerations
1. **Encrypt sensitive data** before storage
2. Use **zero-knowledge proofs** for authentication
3. Implement **access control** at the data layer
4. **Validate all inputs** before processing

### Conflict Resolution
1. Choose **CRDTs** for automatic resolution
2. Use **three-way merge** for complex conflicts
3. Implement **operational transformation** for text
4. Provide **manual resolution** UI when needed

---

[⬅️ Distributed Databases](./README.md) | [⬆️ Top](#distributed-database-architecture-patterns-️) | [🏠 Documentation Home](../../../)