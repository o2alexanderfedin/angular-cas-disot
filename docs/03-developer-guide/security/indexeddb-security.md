# IndexedDB Security & Isolation

[⬅️ Security](../) | [🏠 Documentation Home](../../../)

> **Document Version**: 1.0  
> **Last Updated**: January 2025  
> **Scope**: IndexedDB Security Model  
> **Audience**: Security Engineers, Architects, Developers

## Executive Summary

This report provides a comprehensive analysis of IndexedDB security model, isolation mechanisms, and cross-origin policies. IndexedDB implements strict same-origin policy enforcement, providing automatic isolation between different origins while allowing data sharing within the same origin. Understanding these security boundaries is crucial for architects designing multi-application systems and developers implementing secure client-side storage solutions.

## 1. IndexedDB Security Model Overview

### 1.1 Core Security Principles

IndexedDB implements browser-enforced security through:
- **Same-Origin Policy (SOP)**: Fundamental web security mechanism
- **Automatic Isolation**: No configuration required
- **Origin-Based Storage**: Each origin gets independent storage space
- **Access Control**: Scripts can only access their origin's data

### 1.2 Origin Definition

An origin consists of three components:

```
Origin = Protocol + Hostname + Port
```

**Examples of Different Origins**:
- `https://example.com` (HTTPS protocol)
- `http://example.com` (HTTP protocol)
- `http://example.com:8080` (Different port)
- `http://sub.example.com` (Different subdomain)
- `https://example.com:443` (Default HTTPS port)

Each represents a completely isolated storage space.

## 2. Isolation Mechanisms

### 2.1 Origin-Based Isolation

**Complete Isolation Between**:
| Origin 1 | Origin 2 | Isolation Level |
|----------|----------|-----------------|
| `https://app1.com` | `https://app2.com` | Complete |
| `http://example.com` | `https://example.com` | Complete |
| `http://app.com:3000` | `http://app.com:4000` | Complete |
| `http://main.app.com` | `http://sub.app.com` | Complete |

**Shared Storage Within**:
| URL 1 | URL 2 | Storage Status |
|-------|-------|----------------|
| `https://app.com/page1` | `https://app.com/page2` | Shared |
| `https://app.com/admin` | `https://app.com/user` | Shared |
| `https://app.com/` | `https://app.com/deep/path` | Shared |

### 2.2 Storage Isolation Diagram

```
Browser Storage Architecture
├── https://company.com
│   ├── IndexedDB databases
│   ├── localStorage
│   └── sessionStorage
├── https://app1.company.com
│   ├── IndexedDB databases (isolated)
│   ├── localStorage (isolated)
│   └── sessionStorage (isolated)
├── https://app2.company.com
│   ├── IndexedDB databases (isolated)
│   ├── localStorage (isolated)
│   └── sessionStorage (isolated)
└── http://company.com
    ├── IndexedDB databases (isolated from HTTPS)
    ├── localStorage (isolated)
    └── sessionStorage (isolated)
```

### 2.3 Database Access Matrix

| Accessing Script Origin | Target Database Origin | Access Result |
|------------------------|------------------------|---------------|
| `https://app.com` | `https://app.com` | ✅ Allowed |
| `https://app.com` | `http://app.com` | ❌ Blocked |
| `https://app.com` | `https://app.com:8080` | ❌ Blocked |
| `https://sub.app.com` | `https://app.com` | ❌ Blocked |
| `https://app.com/admin` | `https://app.com` | ✅ Allowed |

## 3. Security Vulnerabilities & Threats

### 3.1 Known Vulnerabilities

**1. Physical Access Attacks**:
- IndexedDB data stored unencrypted on disk
- Accessible via browser DevTools
- Can be extracted with file system access

**2. XSS (Cross-Site Scripting)**:
- Malicious scripts in same origin can access all IndexedDB data
- No built-in encryption or access control within origin

**3. Malware Risks**:
- Browser extensions with appropriate permissions
- Malicious software with file system access
- Memory dumps and debugging tools

**4. Concurrency Issues**:
- No built-in transaction isolation between tabs
- Risk of data corruption without proper locking
- Race conditions in multi-tab scenarios

### 3.2 Security Threat Matrix

| Threat Type | Risk Level | Mitigation Required |
|-------------|------------|-------------------|
| Cross-Origin Access | Low | Built-in browser protection |
| XSS Within Origin | High | Input validation, CSP |
| Physical Device Access | High | Device encryption, secure environments |
| Malicious Extensions | Medium | Extension permissions review |
| Concurrent Access | Medium | Web Locks API, transaction design |
| Data Persistence | Medium | Regular cleanup, expiration policies |

## 4. Multi-Application Architecture Patterns

### 4.1 Isolation Strategies

**Strategy 1: Subdomain Isolation**
```
Production Setup:
├── app1.company.com     (Customer Portal)
├── app2.company.com     (Admin Dashboard)
├── app3.company.com     (Analytics Tool)
└── api.company.com      (Shared API)

Benefits:
- Complete data isolation
- Independent storage quotas
- No accidental data leakage
- Clear security boundaries
```

**Strategy 2: Path-Based Separation (Same Origin)**
```javascript
// Namespace databases by application
const APP_PREFIXES = {
  customerPortal: 'cp_',
  adminDashboard: 'ad_',
  analytics: 'an_'
};

// Customer Portal
const cpDB = await openDB(`${APP_PREFIXES.customerPortal}users`);

// Admin Dashboard  
const adDB = await openDB(`${APP_PREFIXES.adminDashboard}users`);
```

**Strategy 3: Port-Based Isolation (Development)**
```
Development Setup:
├── http://localhost:3000  (App 1)
├── http://localhost:4000  (App 2)
└── http://localhost:5000  (App 3)

Note: Each port creates isolated storage
Exception: IE/Edge treat localhost ports as same origin
```

### 4.2 Architecture Decision Matrix

| Requirement | Subdomain | Same Origin + Namespace | Port-Based |
|-------------|-----------|------------------------|------------|
| Complete Isolation | ✅ Best | ❌ No | ✅ Yes |
| Shared Authentication | ❌ Complex | ✅ Easy | ❌ Complex |
| Storage Quota | ✅ Independent | ❌ Shared | ✅ Independent |
| Cross-App Communication | ❌ PostMessage | ✅ Direct | ❌ PostMessage |
| Production Ready | ✅ Yes | ✅ Yes | ❌ Dev Only |

## 5. Cross-Origin Communication Patterns

### 5.1 PostMessage API

**Secure Cross-Origin Communication**:
```javascript
// App1 (https://app1.company.com)
class CrossOriginStorage {
  constructor(targetOrigin) {
    this.targetOrigin = targetOrigin;
    this.iframe = this.createIframe();
    this.requests = new Map();
    
    window.addEventListener('message', this.handleMessage.bind(this));
  }
  
  createIframe() {
    const iframe = document.createElement('iframe');
    iframe.src = `${this.targetOrigin}/storage-bridge.html`;
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    return iframe;
  }
  
  async get(key) {
    const id = Math.random().toString(36);
    
    return new Promise((resolve) => {
      this.requests.set(id, resolve);
      
      this.iframe.contentWindow.postMessage({
        id,
        action: 'get',
        key
      }, this.targetOrigin);
    });
  }
  
  handleMessage(event) {
    if (event.origin !== this.targetOrigin) return;
    
    const { id, data } = event.data;
    const resolver = this.requests.get(id);
    
    if (resolver) {
      resolver(data);
      this.requests.delete(id);
    }
  }
}

// Usage
const storage = new CrossOriginStorage('https://app2.company.com');
const userData = await storage.get('user-profile');
```

**Storage Bridge (app2.company.com/storage-bridge.html)**:
```javascript
// Whitelist of allowed origins
const ALLOWED_ORIGINS = [
  'https://app1.company.com',
  'https://app3.company.com'
];

window.addEventListener('message', async (event) => {
  if (!ALLOWED_ORIGINS.includes(event.origin)) {
    return;
  }
  
  const { id, action, key, value } = event.data;
  let result;
  
  try {
    const db = await openDB('shared-storage');
    
    switch (action) {
      case 'get':
        result = await db.get('data', key);
        break;
      case 'set':
        await db.put('data', value, key);
        result = { success: true };
        break;
      case 'delete':
        await db.delete('data', key);
        result = { success: true };
        break;
    }
  } catch (error) {
    result = { error: error.message };
  }
  
  event.source.postMessage({
    id,
    data: result
  }, event.origin);
});
```

### 5.2 Shared Backend Pattern

**Architecture**:
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ App1.domain.com │────▶│  Shared API     │◀────│ App2.domain.com │
│   IndexedDB     │     │ api.domain.com  │     │   IndexedDB     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                       │                        │
         └───────────────────────┴────────────────────────┘
                          Sync Strategy
```

**Implementation**:
```javascript
class SyncManager {
  constructor(apiEndpoint) {
    this.api = apiEndpoint;
    this.syncQueue = [];
  }
  
  async syncToBackend() {
    const db = await openDB('local-storage');
    const tx = db.transaction('sync-queue', 'readwrite');
    const items = await tx.store.getAll();
    
    for (const item of items) {
      try {
        await fetch(`${this.api}/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.getToken()}`
          },
          body: JSON.stringify(item)
        });
        
        await tx.store.delete(item.id);
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }
}
```

## 6. Security Best Practices

### 6.1 Data Protection Strategies

**1. Client-Side Encryption**:
```javascript
class SecureStorage {
  constructor(dbName, encryptionKey) {
    this.dbName = dbName;
    this.crypto = new CryptoHandler(encryptionKey);
  }
  
  async store(key, data) {
    const encrypted = await this.crypto.encrypt(
      JSON.stringify(data)
    );
    
    const db = await openDB(this.dbName);
    await db.put('secure-store', {
      key,
      data: encrypted,
      timestamp: Date.now()
    });
  }
  
  async retrieve(key) {
    const db = await openDB(this.dbName);
    const record = await db.get('secure-store', key);
    
    if (!record) return null;
    
    const decrypted = await this.crypto.decrypt(record.data);
    return JSON.parse(decrypted);
  }
}
```

**2. Data Expiration**:
```javascript
class ExpiringStorage {
  async cleanup() {
    const db = await openDB('app-storage');
    const tx = db.transaction('data', 'readwrite');
    const cursor = await tx.store.openCursor();
    
    while (cursor) {
      const { timestamp, ttl } = cursor.value;
      
      if (Date.now() - timestamp > ttl) {
        await cursor.delete();
      }
      
      cursor = await cursor.continue();
    }
  }
}
```

**3. Access Control Layer**:
```javascript
class AccessControlledDB {
  constructor(permissions) {
    this.permissions = permissions;
  }
  
  async read(store, key) {
    if (!this.permissions.canRead(store)) {
      throw new Error('Read access denied');
    }
    
    const db = await openDB('protected-db');
    return db.get(store, key);
  }
  
  async write(store, key, value) {
    if (!this.permissions.canWrite(store)) {
      throw new Error('Write access denied');
    }
    
    const db = await openDB('protected-db');
    await db.put(store, value, key);
    
    // Audit log
    await this.logAccess('write', store, key);
  }
}
```

### 6.2 Development Guidelines

**Security Checklist**:
- [ ] Use HTTPS in production (enforces secure origin)
- [ ] Implement Content Security Policy (CSP)
- [ ] Validate all data before storage
- [ ] Encrypt sensitive data client-side
- [ ] Implement data expiration policies
- [ ] Use Web Locks API for concurrent access
- [ ] Regular security audits of stored data
- [ ] Monitor storage quota usage
- [ ] Implement proper error handling
- [ ] Clear storage on logout

### 6.3 Concurrent Access Management

**Web Locks API Implementation**:
```javascript
class SafeIndexedDB {
  async transaction(stores, mode, callback) {
    const lockName = `db-lock-${stores.join('-')}`;
    
    return await navigator.locks.request(
      lockName,
      { mode: mode === 'readonly' ? 'shared' : 'exclusive' },
      async () => {
        const db = await openDB('app-db');
        const tx = db.transaction(stores, mode);
        
        try {
          const result = await callback(tx);
          await tx.done;
          return result;
        } catch (error) {
          tx.abort();
          throw error;
        }
      }
    );
  }
}

// Usage
const safeDB = new SafeIndexedDB();
await safeDB.transaction(['users'], 'readwrite', async (tx) => {
  const user = await tx.objectStore('users').get(userId);
  user.lastModified = Date.now();
  await tx.objectStore('users').put(user);
});
```

## 7. Compliance & Regulatory Considerations

### 7.1 Data Privacy Regulations

**GDPR Compliance**:
- Right to erasure (implement data deletion)
- Data portability (export functionality)
- Consent management (track permissions)
- Data minimization (store only necessary data)

**Implementation Example**:
```javascript
class GDPRCompliantStorage {
  async exportUserData(userId) {
    const db = await openDB('app-storage');
    const data = {};
    
    // Collect all user data
    for (const storeName of db.objectStoreNames) {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      
      if (store.indexNames.contains('userId')) {
        const index = store.index('userId');
        data[storeName] = await index.getAll(userId);
      }
    }
    
    return data;
  }
  
  async deleteUserData(userId) {
    const db = await openDB('app-storage');
    
    for (const storeName of db.objectStoreNames) {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      if (store.indexNames.contains('userId')) {
        const index = store.index('userId');
        const keys = await index.getAllKeys(userId);
        
        for (const key of keys) {
          await store.delete(key);
        }
      }
    }
  }
}
```

### 7.2 Security Audit Logging

```javascript
class AuditLogger {
  async log(action, details) {
    const db = await openDB('audit-log');
    
    await db.add('logs', {
      timestamp: Date.now(),
      action,
      details,
      userAgent: navigator.userAgent,
      origin: window.location.origin
    });
    
    // Rotate old logs
    await this.rotateLogs();
  }
  
  async rotateLogs() {
    const db = await openDB('audit-log');
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
    
    const tx = db.transaction('logs', 'readwrite');
    const index = tx.store.index('timestamp');
    
    for await (const cursor of index.iterate(IDBKeyRange.upperBound(cutoff))) {
      await cursor.delete();
    }
  }
}
```

## 8. Performance & Security Trade-offs

### 8.1 Encryption Impact

| Operation | Without Encryption | With Encryption | Performance Impact |
|-----------|-------------------|-----------------|-------------------|
| Write 1MB | ~10ms | ~50ms | 5x slower |
| Read 1MB | ~5ms | ~25ms | 5x slower |
| Query 1000 records | ~20ms | ~100ms | 5x slower |

### 8.2 Isolation Overhead

| Architecture | Communication Method | Latency | Complexity |
|--------------|---------------------|---------|------------|
| Same Origin | Direct Access | ~0ms | Low |
| Subdomain PostMessage | PostMessage | ~1-5ms | Medium |
| Cross-Domain API | HTTP/WebSocket | ~10-100ms | High |

## 9. Future Considerations

### 9.1 Emerging Standards

**Storage Access API**:
- Allows cross-origin storage access with user permission
- Currently experimental in some browsers

**Storage Buckets API**:
- Provides better storage organization
- Allows separate eviction policies

**Encrypted Client Storage**:
- Proposed native encryption support
- Would eliminate manual encryption overhead

### 9.2 Browser Evolution

**Expected Changes**:
- Stricter same-origin enforcement
- Enhanced privacy controls
- Better debugging tools
- Native encryption options
- Improved quota management

## 10. Conclusion

IndexedDB provides robust security through same-origin policy enforcement, offering automatic isolation between different origins while allowing flexible data management within the same origin. Key takeaways:

1. **Automatic Isolation**: Browser-enforced, no configuration needed
2. **Origin Definition**: Protocol + Host + Port determines boundaries
3. **Security Limitations**: Vulnerable to XSS, physical access, and malware
4. **Architecture Options**: Subdomains for isolation, namespacing for same-origin
5. **Cross-Origin Solutions**: PostMessage, shared backend, or Storage Access API
6. **Best Practices**: Encryption, access control, audit logging, data expiration

Organizations must carefully design their application architecture considering security requirements, performance needs, and cross-application communication patterns. The combination of browser-enforced isolation and application-level security measures provides a robust foundation for secure client-side storage.

## Appendix: Quick Reference

### Origin Examples
```
Same Origins:
- https://example.com/page1 and https://example.com/page2
- http://app.com/ and http://app.com/admin/

Different Origins:
- https://example.com and http://example.com
- https://app.com and https://sub.app.com  
- http://example.com:3000 and http://example.com:4000
- https://example.com and https://example.org
```

### Security Checklist
- [ ] Use HTTPS in production
- [ ] Implement CSP headers
- [ ] Encrypt sensitive data
- [ ] Use subdomains for isolation
- [ ] Implement proper error handling
- [ ] Add audit logging
- [ ] Set up data expiration
- [ ] Use Web Locks for concurrency
- [ ] Regular security reviews
- [ ] Monitor storage usage

## Related Documentation

- [Browser Storage Options](../architecture/browser-storage.md) - Comprehensive storage technology overview
- [Security Best Practices](./best-practices.md) - General security guidelines
- [Authentication Guide](./authentication.md) - Authentication patterns and implementation
- [System Design](../architecture/system-design.md) - Overall system architecture
- [Testing Strategy](../testing/testing-strategy.md) - Security testing approaches

## External Resources

- [MDN Same-Origin Policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
- [MDN IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Web Locks API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [OWASP Storage Security](https://owasp.org/www-community/vulnerabilities/Insecure_Storage)

---

[⬅️ Security](../) | [⬆️ Top](#indexeddb-security--isolation) | [🏠 Documentation Home](../../../)