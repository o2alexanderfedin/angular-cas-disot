import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { IPFSClient } from './ipfs-client.service';
import { IPFS_CONFIG } from './ipfs-storage.service';
import { IPFSConfig } from '../../domain/interfaces/ipfs.interface';

describe('IPFSClient', () => {
  let client: IPFSClient;
  let httpMock: HttpTestingController;
  
  const mockConfig: IPFSConfig = {
    mode: 'api',
    gateway: 'https://ipfs.io',
    apiEndpoint: 'http://localhost:5001',
    timeout: 30000,
    retryAttempts: 3,
    maxFileSize: 100 * 1024 * 1024,
    enableEncryption: false
  };

  describe('with proper dependency injection', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          IPFSClient,
          { provide: IPFS_CONFIG, useValue: mockConfig }
        ]
      });
      
      client = TestBed.inject(IPFSClient);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should be created with injected config', () => {
      expect(client).toBeTruthy();
    });

    it('should use API mode when configured', () => {
      const data = new Uint8Array([1, 2, 3]);
      
      client.add(data).subscribe();
      
      const req = httpMock.expectOne('http://localhost:5001/api/v0/add?pin=true');
      expect(req.request.method).toBe('POST');
    });

    it('should use gateway mode when configured', () => {
      const gatewayConfig: IPFSConfig = { ...mockConfig, mode: 'gateway' };
      const gatewayClient = new IPFSClient(TestBed.inject(HttpClient), gatewayConfig);
      
      gatewayClient.get('QmTest').subscribe();
      
      const req = httpMock.expectOne('https://ipfs.io/ipfs/QmTest');
      expect(req.request.method).toBe('GET');
    });
  });

  describe('dependency injection errors', () => {
    it('should fail without IPFS_CONFIG token', () => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [IPFSClient]
        // Intentionally not providing IPFS_CONFIG
      });
      
      expect(() => TestBed.inject(IPFSClient)).toThrowError(/No provider for/);
    });

    it('should work with correct injection token', () => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          IPFSClient,
          { provide: IPFS_CONFIG, useValue: mockConfig }
        ]
      });
      
      expect(() => TestBed.inject(IPFSClient)).not.toThrow();
    });
  });

  describe('configuration validation', () => {
    it('should throw error for invalid mode', () => {
      const invalidConfig: IPFSConfig = { ...mockConfig, mode: 'invalid' as any };
      
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          IPFSClient,
          { provide: IPFS_CONFIG, useValue: invalidConfig }
        ]
      });
      
      expect(() => TestBed.inject(IPFSClient)).toThrowError('Invalid IPFS configuration: unsupported mode');
    });

    it('should handle API mode with empty endpoint', () => {
      const configWithEmptyEndpoint: IPFSConfig = { ...mockConfig, apiEndpoint: '' };
      
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          IPFSClient,
          { provide: IPFS_CONFIG, useValue: configWithEmptyEndpoint }
        ]
      });
      
      const client = TestBed.inject(IPFSClient);
      expect(client).toBeTruthy();
      // Should use relative path for proxy
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [HttpClientTestingModule],
        providers: [
          IPFSClient,
          { provide: IPFS_CONFIG, useValue: mockConfig }
        ]
      });
      
      client = TestBed.inject(IPFSClient);
      httpMock = TestBed.inject(HttpTestingController);
    });

    it('should handle network errors on add', (done) => {
      const data = new Uint8Array([1, 2, 3]);
      
      client.add(data).subscribe({
        error: (error) => {
          expect(error.message).toContain('Failed to add to IPFS');
          done();
        }
      });
      
      const req = httpMock.expectOne('http://localhost:5001/api/v0/add?pin=true');
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle timeout', (done) => {
      const data = new Uint8Array([1, 2, 3]);
      
      client.add(data).subscribe({
        error: (error) => {
          expect(error.message).toContain('Failed to add to IPFS');
          done();
        }
      });
      
      const req = httpMock.expectOne('http://localhost:5001/api/v0/add?pin=true');
      // Simulate timeout by not responding
      setTimeout(() => {
        req.flush(null, { status: 0, statusText: 'Timeout' });
      }, 100);
    });
  });
});

// Import HttpClient for the test
import { HttpClient } from '@angular/common/http';