# Cryptography Implementation Notes

## Current Implementation

### SignatureService
- Uses a mock implementation for development and testing
- In production, should be replaced with proper secp256k1 library
- Current implementation uses Web Crypto API for key generation
- Signatures are mocked using SHA-256 hashing

### Production Implementation
To use real secp256k1 signatures in production:

1. Install `@noble/secp256k1` or `@bitcoinerlab/secp256k1`
2. Configure the library with proper entropy source
3. Replace mock signing/verification with real secp256k1 operations
4. Ensure compatibility with Bitcoin, Nostr, and Bluesky protocols

### Security Considerations
- Current implementation is NOT secure for production use
- Only suitable for development and testing
- Real implementation must use proper cryptographic libraries
- Key storage and management needs to be implemented securely