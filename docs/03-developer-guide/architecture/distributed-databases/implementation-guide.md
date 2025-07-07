# Distributed Database Implementation Guide 🛠️

[⬅️ Distributed Databases](./README.md) | [🏠 Documentation Home](../../../)

## Overview

This guide provides practical, production-ready implementations for distributed databases in TypeScript browser applications. We'll focus on the most viable solutions: **Yjs**, **RxDB**, and **Automerge**.

## Table of Contents
1. [Yjs Implementation](#yjs-implementation)
2. [RxDB Implementation](#rxdb-implementation)
3. [Automerge Implementation](#automerge-implementation)
4. [Hybrid Approaches](#hybrid-approaches)
5. [Migration Strategies](#migration-strategies)
6. [Testing Strategies](#testing-strategies)

## Yjs Implementation

### Complete Social Network Example

```typescript
// types.ts
export interface User {
  id: string
  username: string
  profile: UserProfile
  devices: Device[]
}

export interface UserProfile {
  displayName: string
  bio?: string
  avatar?: string
  lastUpdated: number
}

export interface Device {
  id: string
  name: string
  lastSeen: number
  publicKey: string
}

export interface Post {
  id: string
  authorId: string
  content: string
  media?: string[]
  likes: Set<string>
  comments: Comment[]
  timestamp: number
}

export interface Comment {
  id: string
  authorId: string
  text: string
  timestamp: number
}
```

```typescript
// social-network.ts
import * as Y from 'yjs'
import { WebrtcProvider } from 'y-webrtc'
import { IndexeddbPersistence } from 'y-indexeddb'
import * as awarenessProtocol from 'y-protocols/awareness'
import { Observable } from 'lib0/observable'

export class DistributedSocialNetwork extends Observable<any> {
  private doc: Y.Doc
  private awareness: awarenessProtocol.Awareness
  private providers: Map<string, any> = new Map()
  
  // Shared data structures
  private users: Y.Map<User>
  private posts: Y.Array<Post>
  private following: Y.Map<Set<string>>
  private messages: Y.Map<Y.Array<Message>>
  
  constructor(private userId: string) {
    super()
    
    // Initialize document
    this.doc = new Y.Doc()
    this.doc.gc = true // Enable garbage collection
    
    // Initialize shared types
    this.users = this.doc.getMap('users')
    this.posts = this.doc.getArray('posts')
    this.following = this.doc.getMap('following')
    this.messages = this.doc.getMap('messages')
    
    // Initialize awareness for presence
    this.awareness = new awarenessProtocol.Awareness(this.doc)
    
    // Setup providers
    this.setupProviders()
    
    // Initialize user if new
    this.initializeUser()
  }
  
  private setupProviders() {
    // Local persistence
    const persistence = new IndexeddbPersistence(
      `social-${this.userId}`,
      this.doc
    )
    this.providers.set('persistence', persistence)
    
    // WebRTC for P2P sync
    const webrtcProvider = new WebrtcProvider(
      `social-network-main`,
      this.doc,
      {
        signaling: [
          'wss://signaling.yjs.dev',
          'wss://y-webrtc-signaling-eu.herokuapp.com'
        ],
        password: 'optional-room-password',
        awareness: this.awareness,
        maxConns: 20,
        filterBcConns: true
      }
    )
    this.providers.set('webrtc', webrtcProvider)
    
    // Handle provider events
    webrtcProvider.on('synced', (synced: boolean) => {
      this.emit('sync-status', [{ synced, provider: 'webrtc' }])
    })
  }
  
  private initializeUser() {
    if (!this.users.has(this.userId)) {
      const newUser: User = {
        id: this.userId,
        username: `user_${this.userId.slice(0, 8)}`,
        profile: {
          displayName: 'New User',
          lastUpdated: Date.now()
        },
        devices: [{
          id: this.generateDeviceId(),
          name: this.getDeviceName(),
          lastSeen: Date.now(),
          publicKey: this.generatePublicKey()
        }]
      }
      
      this.doc.transact(() => {
        this.users.set(this.userId, newUser)
        this.following.set(this.userId, new Set())
      })
    }
    
    // Set presence
    this.updatePresence('online')
  }
  
  // User Management
  updateProfile(updates: Partial<UserProfile>) {
    this.doc.transact(() => {
      const user = this.users.get(this.userId)
      if (user) {
        user.profile = {
          ...user.profile,
          ...updates,
          lastUpdated: Date.now()
        }
        this.users.set(this.userId, user)
      }
    })
  }
  
  // Social Features
  async createPost(content: string, media?: string[]): Promise<string> {
    const post: Post = {
      id: this.generateId(),
      authorId: this.userId,
      content,
      media,
      likes: new Set(),
      comments: [],
      timestamp: Date.now()
    }
    
    this.doc.transact(() => {
      this.posts.push([post])
    })
    
    this.emit('post-created', [post])
    return post.id
  }
  
  likePost(postId: string) {
    this.doc.transact(() => {
      const postIndex = this.posts.toArray()
        .findIndex(p => p.id === postId)
      
      if (postIndex !== -1) {
        const post = this.posts.get(postIndex)
        post.likes.add(this.userId)
        this.posts.delete(postIndex)
        this.posts.insert(postIndex, [post])
      }
    })
  }
  
  followUser(targetUserId: string) {
    this.doc.transact(() => {
      const myFollowing = this.following.get(this.userId) || new Set()
      myFollowing.add(targetUserId)
      this.following.set(this.userId, myFollowing)
    })
  }
  
  // Messaging
  sendMessage(recipientId: string, text: string) {
    const conversationId = this.getConversationId(recipientId)
    
    this.doc.transact(() => {
      if (!this.messages.has(conversationId)) {
        this.messages.set(conversationId, this.doc.getArray())
      }
      
      const conversation = this.messages.get(conversationId)!
      conversation.push([{
        id: this.generateId(),
        from: this.userId,
        to: recipientId,
        text,
        timestamp: Date.now(),
        read: false
      }])
    })
  }
  
  // Queries
  getFeed(limit: number = 50): Post[] {
    const following = this.following.get(this.userId) || new Set()
    const followingIds = new Set([this.userId, ...following])
    
    return this.posts
      .toArray()
      .filter(post => followingIds.has(post.authorId))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }
  
  searchUsers(query: string): User[] {
    const users: User[] = []
    const lowerQuery = query.toLowerCase()
    
    this.users.forEach(user => {
      if (
        user.username.toLowerCase().includes(lowerQuery) ||
        user.profile.displayName.toLowerCase().includes(lowerQuery)
      ) {
        users.push(user)
      }
    })
    
    return users
  }
  
  // Presence & Awareness
  private updatePresence(status: 'online' | 'away' | 'offline') {
    this.awareness.setLocalStateField('user', {
      id: this.userId,
      status,
      lastSeen: Date.now()
    })
  }
  
  getOnlineUsers(): string[] {
    const states = this.awareness.getStates()
    const onlineUsers: string[] = []
    
    states.forEach(state => {
      if (state.user?.status === 'online') {
        onlineUsers.push(state.user.id)
      }
    })
    
    return onlineUsers
  }
  
  // Observers
  observePosts(callback: (posts: Post[]) => void) {
    const handler = () => callback(this.posts.toArray())
    this.posts.observe(handler)
    return () => this.posts.unobserve(handler)
  }
  
  observeUser(userId: string, callback: (user: User | undefined) => void) {
    const handler = () => callback(this.users.get(userId))
    this.users.observe(handler)
    return () => this.users.unobserve(handler)
  }
  
  // Cleanup
  destroy() {
    this.providers.forEach(provider => {
      if (provider.destroy) provider.destroy()
    })
    this.doc.destroy()
  }
  
  // Utilities
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
  
  private generateDeviceId(): string {
    return crypto.randomUUID()
  }
  
  private getDeviceName(): string {
    const ua = navigator.userAgent
    if (/mobile/i.test(ua)) return 'Mobile Device'
    if (/tablet/i.test(ua)) return 'Tablet'
    return 'Desktop'
  }
  
  private generatePublicKey(): string {
    // In production, use proper crypto
    return btoa(crypto.getRandomValues(new Uint8Array(32)).toString())
  }
  
  private getConversationId(otherId: string): string {
    return [this.userId, otherId].sort().join('-')
  }
}
```

### React Integration

```typescript
// hooks/useYjs.ts
import { useEffect, useState, useCallback, useRef } from 'react'
import * as Y from 'yjs'

export function useYArray<T>(yarray: Y.Array<T>) {
  const [data, setData] = useState<T[]>(yarray.toArray())
  
  useEffect(() => {
    const handler = () => setData(yarray.toArray())
    yarray.observe(handler)
    return () => yarray.unobserve(handler)
  }, [yarray])
  
  return data
}

export function useYMap<T>(ymap: Y.Map<T>, key?: string) {
  const [data, setData] = useState<T | undefined>(
    key ? ymap.get(key) : undefined
  )
  
  useEffect(() => {
    const handler = () => {
      setData(key ? ymap.get(key) : undefined)
    }
    ymap.observe(handler)
    return () => ymap.unobserve(handler)
  }, [ymap, key])
  
  return data
}

// Component example
export function PostFeed({ network }: { network: DistributedSocialNetwork }) {
  const posts = useYArray(network.posts)
  const [loading, setLoading] = useState(false)
  
  const handleLike = useCallback((postId: string) => {
    network.likePost(postId)
  }, [network])
  
  return (
    <div>
      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          onLike={() => handleLike(post.id)}
        />
      ))}
    </div>
  )
}
```

## RxDB Implementation

### Schema-Based Social Network

```typescript
// schemas.ts
export const userSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    username: { type: 'string', maxLength: 50 },
    email: { type: 'string', maxLength: 100 },
    profile: {
      type: 'object',
      properties: {
        displayName: { type: 'string' },
        bio: { type: 'string' },
        avatar: { type: 'string' },
        verified: { type: 'boolean' }
      }
    },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' }
  },
  required: ['id', 'username', 'email'],
  indexes: ['username', 'email', 'createdAt']
}

export const postSchema = {
  version: 0,
  primaryKey: 'id',
  type: 'object',
  properties: {
    id: { type: 'string', maxLength: 100 },
    authorId: { type: 'string', maxLength: 100 },
    content: { type: 'string', maxLength: 5000 },
    media: {
      type: 'array',
      items: { type: 'string' }
    },
    likes: {
      type: 'array',
      items: { type: 'string' }
    },
    tags: {
      type: 'array',
      items: { type: 'string' }
    },
    timestamp: { type: 'number' },
    edited: { type: 'boolean' },
    editedAt: { type: 'number' }
  },
  required: ['id', 'authorId', 'content', 'timestamp'],
  indexes: ['authorId', 'timestamp', ['authorId', 'timestamp']]
}
```

```typescript
// database.ts
import {
  createRxDatabase,
  RxDatabase,
  RxCollection,
  addRxPlugin
} from 'rxdb'
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { RxDBQueryBuilderPlugin } from 'rxdb/plugins/query-builder'
import { RxDBMigrationPlugin } from 'rxdb/plugins/migration'
import { RxDBReplicationWebRTCPlugin } from 'rxdb/plugins/replication-webrtc'

// Add plugins
if (process.env.NODE_ENV === 'development') {
  addRxPlugin(RxDBDevModePlugin)
}
addRxPlugin(RxDBQueryBuilderPlugin)
addRxPlugin(RxDBMigrationPlugin)
addRxPlugin(RxDBReplicationWebRTCPlugin)

export class SocialNetworkDB {
  private db: RxDatabase
  
  // Collections
  users: RxCollection
  posts: RxCollection
  messages: RxCollection
  
  async initialize(name: string, password?: string) {
    // Create database
    this.db = await createRxDatabase({
      name,
      storage: getRxStorageDexie(),
      password, // Optional encryption
      multiInstance: true,
      eventReduce: true
    })
    
    // Add collections
    const collections = await this.db.addCollections({
      users: {
        schema: userSchema,
        methods: {
          async getProfile(this: any) {
            return this.profile
          }
        }
      },
      posts: {
        schema: postSchema,
        methods: {
          async toggleLike(this: any, userId: string) {
            const likes = this.likes || []
            const index = likes.indexOf(userId)
            
            if (index === -1) {
              likes.push(userId)
            } else {
              likes.splice(index, 1)
            }
            
            await this.patch({ likes })
          }
        }
      }
    })
    
    this.users = collections.users
    this.posts = collections.posts
    
    // Setup replication
    await this.setupReplication()
    
    return this
  }
  
  private async setupReplication() {
    // WebRTC replication for P2P sync
    const replicationState = await this.posts.syncWebRTC({
      topic: 'social-network-posts',
      connectionHandlerCreator: () => {
        // Custom WebRTC connection setup
        return {
          connect: async () => {
            const peer = new SimplePeer({ initiator: true })
            // Setup peer connection
            return peer
          },
          disconnect: async () => {
            // Cleanup
          }
        }
      },
      pull: {},
      push: {}
    })
    
    // Monitor replication
    replicationState.error$.subscribe(error => {
      console.error('Replication error:', error)
    })
  }
  
  // User operations
  async createUser(userData: any) {
    const user = await this.users.insert({
      ...userData,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    return user
  }
  
  async updateUser(userId: string, updates: any) {
    const user = await this.users.findOne(userId).exec()
    if (user) {
      await user.patch({
        ...updates,
        updatedAt: Date.now()
      })
    }
    return user
  }
  
  // Post operations
  async createPost(postData: any) {
    const post = await this.posts.insert({
      ...postData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      edited: false,
      likes: []
    })
    return post
  }
  
  async getFeed(userId: string, limit = 50) {
    // Get user's following list
    const user = await this.users.findOne(userId).exec()
    const following = user?.following || []
    
    // Query posts from followed users
    const posts = await this.posts.find({
      selector: {
        authorId: {
          $in: [...following, userId]
        }
      },
      sort: [{ timestamp: 'desc' }],
      limit
    }).exec()
    
    return posts
  }
  
  // Complex queries
  async searchPosts(query: string, filters: any = {}) {
    const selector: any = {
      $or: [
        { content: { $regex: query, $options: 'i' } },
        { tags: { $elemMatch: { $eq: query } } }
      ]
    }
    
    if (filters.authorId) {
      selector.authorId = filters.authorId
    }
    
    if (filters.dateFrom || filters.dateTo) {
      selector.timestamp = {}
      if (filters.dateFrom) {
        selector.timestamp.$gte = filters.dateFrom
      }
      if (filters.dateTo) {
        selector.timestamp.$lte = filters.dateTo
      }
    }
    
    return this.posts.find({
      selector,
      sort: [{ timestamp: 'desc' }]
    }).exec()
  }
  
  // Reactive queries
  async getReactiveFeed(userId: string) {
    return this.posts.find({
      selector: {
        authorId: userId
      },
      sort: [{ timestamp: 'desc' }]
    }).$ // Returns RxJS Observable
  }
  
  // Aggregations
  async getStats(userId: string) {
    const posts = await this.posts.find({
      selector: { authorId: userId }
    }).exec()
    
    const totalLikes = posts.reduce((sum, post) => {
      return sum + (post.likes?.length || 0)
    }, 0)
    
    return {
      postCount: posts.length,
      totalLikes,
      avgLikesPerPost: totalLikes / posts.length || 0
    }
  }
  
  // Backup & Restore
  async exportData() {
    const dump = await this.db.exportJSON()
    return dump
  }
  
  async importData(dump: any) {
    await this.db.importJSON(dump)
  }
  
  // Cleanup
  async destroy() {
    await this.db.destroy()
  }
}

// React Hook
export function useRxQuery<T>(query: any) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    const sub = query.$.subscribe({
      next: (results: T[]) => {
        setData(results)
        setLoading(false)
      },
      error: (err: Error) => {
        setError(err)
        setLoading(false)
      }
    })
    
    return () => sub.unsubscribe()
  }, [query])
  
  return { data, loading, error }
}
```

## Automerge Implementation

### Document-Based Collaboration

```typescript
// automerge-social.ts
import * as Automerge from '@automerge/automerge'
import { BroadcastChannel } from 'broadcast-channel'

interface DocState {
  users: { [id: string]: User }
  posts: Post[]
  following: { [userId: string]: string[] }
  messages: { [conversationId: string]: Message[] }
}

export class AutomergeSocialNetwork {
  private doc: Automerge.Doc<DocState>
  private channel: BroadcastChannel
  private peers: Map<string, Automerge.Doc<DocState>> = new Map()
  
  constructor(private userId: string) {
    // Initialize document
    this.doc = Automerge.init()
    
    // Setup initial structure
    this.doc = Automerge.change(this.doc, 'Initialize', doc => {
      doc.users = {}
      doc.posts = []
      doc.following = {}
      doc.messages = {}
    })
    
    // Setup broadcast channel for local sync
    this.channel = new BroadcastChannel('automerge-social')
    this.setupSync()
  }
  
  private setupSync() {
    // Listen for changes from other tabs/windows
    this.channel.addEventListener('message', (msg: any) => {
      if (msg.type === 'changes' && msg.senderId !== this.userId) {
        const changes = msg.changes.map((c: string) => 
          Automerge.decodeChange(c)
        )
        this.doc = Automerge.applyChanges(this.doc, changes)
      }
    })
    
    // Broadcast our changes
    Automerge.observe(this.doc, (patches, info) => {
      const changes = Automerge.getChanges(info.before, info.after)
        .map(c => Automerge.encodeChange(c))
      
      this.channel.postMessage({
        type: 'changes',
        senderId: this.userId,
        changes
      })
    })
  }
  
  // User management
  createUser(userData: Omit<User, 'id'>) {
    const userId = crypto.randomUUID()
    
    this.doc = Automerge.change(this.doc, 'Create user', doc => {
      doc.users[userId] = {
        id: userId,
        ...userData
      }
    })
    
    return userId
  }
  
  updateProfile(updates: Partial<UserProfile>) {
    this.doc = Automerge.change(this.doc, 'Update profile', doc => {
      if (doc.users[this.userId]) {
        doc.users[this.userId].profile = {
          ...doc.users[this.userId].profile,
          ...updates,
          lastUpdated: Date.now()
        }
      }
    })
  }
  
  // Posts
  createPost(content: string, media?: string[]) {
    const postId = crypto.randomUUID()
    
    this.doc = Automerge.change(this.doc, 'Create post', doc => {
      doc.posts.push({
        id: postId,
        authorId: this.userId,
        content,
        media: media || [],
        likes: new Set(),
        comments: [],
        timestamp: Date.now()
      })
    })
    
    return postId
  }
  
  // Time travel
  getHistory() {
    const history = Automerge.getHistory(this.doc)
    return history.map(state => ({
      change: state.change,
      snapshot: state.snapshot,
      timestamp: state.change.time
    }))
  }
  
  timeTravel(to: number) {
    const history = Automerge.getHistory(this.doc)
    if (history[to]) {
      return history[to].snapshot
    }
    return this.doc
  }
  
  // Conflict resolution
  merge(otherDoc: Automerge.Doc<DocState>) {
    this.doc = Automerge.merge(this.doc, otherDoc)
  }
  
  // Persistence
  save(): string {
    return Automerge.save(this.doc)
  }
  
  load(data: string) {
    this.doc = Automerge.load<DocState>(data)
  }
  
  // Sync with peers
  getSyncState(peerId: string) {
    if (!this.peers.has(peerId)) {
      this.peers.set(peerId, Automerge.init())
    }
    
    const [nextDoc, nextPeer, patch] = Automerge.sync(
      this.doc,
      this.peers.get(peerId)!
    )
    
    this.doc = nextDoc
    this.peers.set(peerId, nextPeer)
    
    return patch
  }
  
  receiveSyncMessage(peerId: string, message: Uint8Array) {
    if (!this.peers.has(peerId)) {
      this.peers.set(peerId, Automerge.init())
    }
    
    const [nextDoc, nextPeer, patch] = Automerge.receiveSyncMessage(
      this.doc,
      this.peers.get(peerId)!,
      message
    )
    
    this.doc = nextDoc
    this.peers.set(peerId, nextPeer)
    
    return patch
  }
}
```

## Hybrid Approaches

### Yjs + IndexedDB + WebRTC

```typescript
// hybrid-storage.ts
import * as Y from 'yjs'
import Dexie from 'dexie'

export class HybridStorage {
  private db: Dexie
  private doc: Y.Doc
  
  constructor(dbName: string) {
    // Local database for queries
    this.db = new Dexie(dbName)
    this.db.version(1).stores({
      users: 'id, username, email',
      posts: 'id, authorId, timestamp, [authorId+timestamp]',
      cache: 'key'
    })
    
    // Yjs for sync
    this.doc = new Y.Doc()
    
    // Sync Yjs to IndexedDB
    this.doc.on('update', () => {
      this.syncToIndexedDB()
    })
  }
  
  private async syncToIndexedDB() {
    const users = this.doc.getMap('users')
    const posts = this.doc.getArray('posts')
    
    // Batch update IndexedDB
    await this.db.transaction('rw', this.db.users, this.db.posts, async () => {
      // Update users
      for (const [id, user] of users.entries()) {
        await this.db.users.put(user)
      }
      
      // Update posts
      await this.db.posts.bulkPut(posts.toArray())
    })
  }
  
  // Query with IndexedDB
  async queryPosts(filter: any) {
    let query = this.db.posts
    
    if (filter.authorId) {
      query = query.where('authorId').equals(filter.authorId)
    }
    
    if (filter.dateRange) {
      query = query.where('timestamp')
        .between(filter.dateRange.from, filter.dateRange.to)
    }
    
    return query.toArray()
  }
  
  // Update with Yjs
  updatePost(postId: string, updates: any) {
    const posts = this.doc.getArray('posts')
    const index = posts.toArray().findIndex(p => p.id === postId)
    
    if (index !== -1) {
      const post = posts.get(index)
      posts.delete(index)
      posts.insert(index, [{ ...post, ...updates }])
    }
  }
}
```

## Migration Strategies

### From OrbitDB to Yjs

```typescript
// migration.ts
export class OrbitDBToYjsMigration {
  async migrate(orbitdb: any, ydoc: Y.Doc) {
    console.log('Starting migration from OrbitDB to Yjs...')
    
    // Migrate KeyValue stores
    const kvStores = await this.getOrbitDBStores(orbitdb, 'keyvalue')
    for (const store of kvStores) {
      const ymap = ydoc.getMap(store.name)
      const data = await store.all()
      
      ydoc.transact(() => {
        Object.entries(data).forEach(([key, value]) => {
          ymap.set(key, value)
        })
      })
    }
    
    // Migrate Feed stores
    const feedStores = await this.getOrbitDBStores(orbitdb, 'feed')
    for (const store of feedStores) {
      const yarray = ydoc.getArray(store.name)
      const entries = store.iterator({ limit: -1 }).collect()
      
      ydoc.transact(() => {
        yarray.push(entries.map(e => e.payload.value))
      })
    }
    
    // Migrate Document stores
    const docStores = await this.getOrbitDBStores(orbitdb, 'docstore')
    for (const store of docStores) {
      const ymap = ydoc.getMap(store.name)
      const docs = await store.query(() => true)
      
      ydoc.transact(() => {
        docs.forEach((doc: any) => {
          ymap.set(doc._id, doc)
        })
      })
    }
    
    console.log('Migration completed!')
    return ydoc
  }
  
  private async getOrbitDBStores(orbitdb: any, type: string) {
    // Get all stores of specific type
    // Implementation depends on OrbitDB setup
    return []
  }
}

// Usage
const migration = new OrbitDBToYjsMigration()
const ydoc = await migration.migrate(orbitdbInstance, new Y.Doc())

// Save migrated data
const persistence = new IndexeddbPersistence('migrated-db', ydoc)
```

## Testing Strategies

### Unit Testing Yjs

```typescript
// tests/yjs.test.ts
import * as Y from 'yjs'
import { DistributedSocialNetwork } from '../social-network'

describe('DistributedSocialNetwork', () => {
  let network: DistributedSocialNetwork
  
  beforeEach(() => {
    network = new DistributedSocialNetwork('test-user')
  })
  
  afterEach(() => {
    network.destroy()
  })
  
  test('should create post', async () => {
    const postId = await network.createPost('Hello world')
    const posts = network.getFeed(1)
    
    expect(posts).toHaveLength(1)
    expect(posts[0].content).toBe('Hello world')
    expect(posts[0].id).toBe(postId)
  })
  
  test('should sync between instances', async () => {
    const network2 = new DistributedSocialNetwork('test-user-2')
    
    // Create post in first instance
    await network.createPost('Test sync')
    
    // Wait for sync
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Check second instance
    const posts = network2.getFeed(10)
    expect(posts.some(p => p.content === 'Test sync')).toBe(true)
    
    network2.destroy()
  })
  
  test('should handle concurrent edits', () => {
    const doc1 = new Y.Doc()
    const doc2 = new Y.Doc()
    
    const map1 = doc1.getMap('test')
    const map2 = doc2.getMap('test')
    
    // Concurrent edits
    map1.set('key', 'value1')
    map2.set('key', 'value2')
    
    // Sync
    const state1 = Y.encodeStateAsUpdate(doc1)
    const state2 = Y.encodeStateAsUpdate(doc2)
    
    Y.applyUpdate(doc1, state2)
    Y.applyUpdate(doc2, state1)
    
    // Both should have same value (last-write-wins)
    expect(map1.get('key')).toBe(map2.get('key'))
  })
})
```

### Integration Testing

```typescript
// tests/integration.test.ts
import { WebrtcProvider } from 'y-webrtc'
import puppeteer from 'puppeteer'

describe('P2P Sync Integration', () => {
  test('should sync across browser instances', async () => {
    const browser1 = await puppeteer.launch()
    const browser2 = await puppeteer.launch()
    
    const page1 = await browser1.newPage()
    const page2 = await browser2.newPage()
    
    // Load application
    await page1.goto('http://localhost:3000')
    await page2.goto('http://localhost:3000')
    
    // Create content in first browser
    await page1.evaluate(() => {
      window.network.createPost('Integration test post')
    })
    
    // Wait for sync
    await page2.waitForFunction(
      () => window.network.getFeed(10).length > 0,
      { timeout: 5000 }
    )
    
    // Verify content synced
    const posts = await page2.evaluate(() => 
      window.network.getFeed(10)
    )
    
    expect(posts[0].content).toBe('Integration test post')
    
    await browser1.close()
    await browser2.close()
  })
})
```

## Performance Monitoring

```typescript
// performance.ts
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  
  measureYjsOperation<T>(
    name: string,
    operation: () => T
  ): T {
    const start = performance.now()
    const result = operation()
    const duration = performance.now() - start
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    this.metrics.get(name)!.push(duration)
    
    return result
  }
  
  getStats(operation: string) {
    const times = this.metrics.get(operation) || []
    if (times.length === 0) return null
    
    const sorted = [...times].sort((a, b) => a - b)
    return {
      count: times.length,
      mean: times.reduce((a, b) => a + b) / times.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    }
  }
}
```

## Best Practices

### 1. Data Modeling
- Use appropriate data structures (Map vs Array)
- Keep documents focused and small
- Implement sharding for large datasets

### 2. Sync Optimization
- Use selective sync for large documents
- Implement debouncing for frequent updates
- Monitor bandwidth usage

### 3. Error Handling
- Implement retry logic for network failures
- Handle sync conflicts gracefully
- Provide offline indicators

### 4. Security
- Encrypt sensitive data
- Validate all inputs
- Implement access control

### 5. Performance
- Use transactions for batch operations
- Enable garbage collection
- Monitor memory usage

## Conclusion

This implementation guide provides production-ready patterns for building distributed applications with modern alternatives to OrbitDB. Choose the solution that best fits your specific requirements:

- **Yjs** for real-time collaboration
- **RxDB** for complex queries and schemas
- **Automerge** for git-like versioning
- **Hybrid** approaches for best of both worlds

Remember to test thoroughly, monitor performance, and implement proper error handling for production deployments.

---

[⬅️ Distributed Databases](./README.md) | [⬆️ Top](#distributed-database-implementation-guide-️) | [🏠 Documentation Home](../../../)