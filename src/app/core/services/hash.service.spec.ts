import { HashService } from './hash.service';

describe('HashService', () => {
  let service: HashService;

  beforeEach(() => {
    service = new HashService();
  });

  it('should create', () => {
    expect(service).toBeTruthy();
  });

  it('should hash data using SHA-256', async () => {
    const testData = new TextEncoder().encode('Hello, World!');
    const hash = await service.hash(testData);
    
    expect(hash).toBeTruthy();
    expect(hash.length).toBe(64); // SHA-256 produces 64 hex characters
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should produce consistent hash for same data', async () => {
    const testData = new TextEncoder().encode('Test Data');
    const hash1 = await service.hash(testData);
    const hash2 = await service.hash(testData);
    
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different data', async () => {
    const data1 = new TextEncoder().encode('Data 1');
    const data2 = new TextEncoder().encode('Data 2');
    
    const hash1 = await service.hash(data1);
    const hash2 = await service.hash(data2);
    
    expect(hash1).not.toBe(hash2);
  });

  it('should verify correct hash', async () => {
    const testData = new TextEncoder().encode('Verify Me');
    const hash = await service.hash(testData);
    const isValid = await service.verify(testData, hash);
    
    expect(isValid).toBe(true);
  });

  it('should reject incorrect hash', async () => {
    const testData = new TextEncoder().encode('Verify Me');
    const incorrectHash = 'a'.repeat(64);
    const isValid = await service.verify(testData, incorrectHash);
    
    expect(isValid).toBe(false);
  });
});