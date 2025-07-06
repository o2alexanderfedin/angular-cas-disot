import { TestBed } from '@angular/core/testing';
import { IPFSShareLinkService } from './ipfs-share-link.service';
import { IPFS_CONFIG } from './ipfs-storage.service';
import { IPFSConfig } from '../../domain/interfaces/ipfs.interface';

describe('IPFSShareLinkService', () => {
  let service: IPFSShareLinkService;
  const mockCid = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
  
  const mockConfig: IPFSConfig = {
    mode: 'api',
    gateway: 'http://127.0.0.1:8080',
    apiEndpoint: '/api/v0',
    timeout: 30000,
    retryAttempts: 3,
    maxFileSize: 100 * 1024 * 1024,
    enableEncryption: false
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        IPFSShareLinkService,
        { provide: IPFS_CONFIG, useValue: mockConfig }
      ]
    });
    service = TestBed.inject(IPFSShareLinkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('generateShareLink', () => {
    it('should generate a basic share link with default gateway', () => {
      const link = service.generateShareLink(mockCid);
      expect(link).toBe(`https://ipfs.io/ipfs/${mockCid}`);
    });

    it('should use custom gateway when provided', () => {
      const customGateway = 'https://custom.gateway.com';
      const link = service.generateShareLink(mockCid, { gateway: customGateway });
      expect(link).toBe(`${customGateway}/ipfs/${mockCid}`);
    });

    it('should add filename parameter when provided', () => {
      const filename = 'test-file.txt';
      const link = service.generateShareLink(mockCid, { filename });
      expect(link).toBe(`https://ipfs.io/ipfs/${mockCid}?filename=${encodeURIComponent(filename)}`);
    });

    it('should add download parameter when requested', () => {
      const link = service.generateShareLink(mockCid, { download: true });
      expect(link).toBe(`https://ipfs.io/ipfs/${mockCid}?download=true`);
    });

    it('should combine filename and download parameters', () => {
      const filename = 'test-file.txt';
      const link = service.generateShareLink(mockCid, { filename, download: true });
      expect(link).toBe(`https://ipfs.io/ipfs/${mockCid}?filename=${encodeURIComponent(filename)}&download=true`);
    });
  });

  describe('generateMultipleShareLinks', () => {
    it('should generate links for all public gateways', () => {
      const links = service.generateMultipleShareLinks(mockCid);
      const publicGateways = service.getPublicGateways();
      
      expect(links.length).toBe(publicGateways.length);
      links.forEach((link, index) => {
        expect(link).toBe(`${publicGateways[index]}/ipfs/${mockCid}`);
      });
    });

    it('should apply options to all generated links', () => {
      const filename = 'test.txt';
      const links = service.generateMultipleShareLinks(mockCid, { filename });
      
      links.forEach(link => {
        expect(link).toContain(`?filename=${encodeURIComponent(filename)}`);
      });
    });
  });

  describe('generateLocalShareLink', () => {
    it('should use configured gateway for local link', () => {
      const link = service.generateLocalShareLink(mockCid);
      expect(link).toBe(`${mockConfig.gateway}/ipfs/${mockCid}`);
    });

    it('should use default local gateway when not configured', () => {
      const configWithoutGateway: IPFSConfig = { ...mockConfig, gateway: '' };
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          IPFSShareLinkService,
          { provide: IPFS_CONFIG, useValue: configWithoutGateway }
        ]
      });
      const serviceWithoutGateway = TestBed.inject(IPFSShareLinkService);
      
      const link = serviceWithoutGateway.generateLocalShareLink(mockCid);
      expect(link).toBe(`http://127.0.0.1:8080/ipfs/${mockCid}`);
    });
  });

  describe('checkGatewayAvailability', () => {
    let originalFetch: typeof fetch;

    beforeEach(() => {
      originalFetch = window.fetch;
      window.fetch = jasmine.createSpy('fetch');
    });

    afterEach(() => {
      window.fetch = originalFetch;
    });

    it('should return true for available gateway', async () => {
      (window.fetch as jasmine.Spy).and.returnValue(Promise.resolve({ ok: true } as Response));
      
      const isAvailable = await service.checkGatewayAvailability(mockCid);
      expect(isAvailable).toBe(true);
      expect(window.fetch).toHaveBeenCalledWith(
        jasmine.stringContaining(`/ipfs/${mockCid}`),
        jasmine.objectContaining({ method: 'HEAD' })
      );
    });

    it('should return false for unavailable gateway', async () => {
      (window.fetch as jasmine.Spy).and.returnValue(Promise.resolve({ ok: false } as Response));
      
      const isAvailable = await service.checkGatewayAvailability(mockCid);
      expect(isAvailable).toBe(false);
    });

    it('should return false on network error', async () => {
      (window.fetch as jasmine.Spy).and.returnValue(Promise.reject(new Error('Network error')));
      
      const isAvailable = await service.checkGatewayAvailability(mockCid);
      expect(isAvailable).toBe(false);
    });
  });

  describe('findAvailableGateway', () => {
    let originalFetch: typeof fetch;

    beforeEach(() => {
      originalFetch = window.fetch;
      window.fetch = jasmine.createSpy('fetch');
    });

    afterEach(() => {
      window.fetch = originalFetch;
    });

    it('should return local gateway if available', async () => {
      (window.fetch as jasmine.Spy).and.returnValue(Promise.resolve({ ok: true } as Response));
      
      const gateway = await service.findAvailableGateway(mockCid);
      expect(gateway).toBe(mockConfig.gateway);
    });

    it('should check public gateways if local is unavailable', async () => {
      let callCount = 0;
      (window.fetch as jasmine.Spy).and.callFake(() => {
        callCount++;
        if (callCount === 1 || callCount === 2) {
          return Promise.resolve({ ok: false } as Response);
        }
        return Promise.resolve({ ok: true } as Response);
      });
      
      const gateway = await service.findAvailableGateway(mockCid);
      expect(gateway).toBe(service.getPublicGateways()[1]);
    });

    it('should return null if no gateways are available', async () => {
      (window.fetch as jasmine.Spy).and.returnValue(Promise.resolve({ ok: false } as Response));
      
      const gateway = await service.findAvailableGateway(mockCid);
      expect(gateway).toBeNull();
    });
  });

  describe('utility methods', () => {
    it('should format bytes correctly', () => {
      expect(service.formatBytes(0)).toBe('0 Bytes');
      expect(service.formatBytes(1024)).toBe('1 KB');
      expect(service.formatBytes(1048576)).toBe('1 MB');
      expect(service.formatBytes(1073741824)).toBe('1 GB');
      expect(service.formatBytes(1536)).toBe('1.5 KB');
    });

    it('should generate IPFS protocol link', () => {
      const link = service.generateProtocolLink(mockCid);
      expect(link).toBe(`ipfs://${mockCid}`);
    });

    it('should generate IPNS protocol link', () => {
      const name = 'example.eth';
      const link = service.generateIPNSLink(name);
      expect(link).toBe(`ipns://${name}`);
    });

    it('should return public gateways list', () => {
      const gateways = service.getPublicGateways();
      expect(gateways).toBeInstanceOf(Array);
      expect(gateways.length).toBeGreaterThan(0);
      expect(gateways[0]).toMatch(/^https?:\/\//);
    });
  });

  describe('gateway mode configuration', () => {
    it('should use gateway from config when in gateway mode', () => {
      const gatewayConfig: IPFSConfig = {
        ...mockConfig,
        mode: 'gateway',
        gateway: 'https://my-gateway.com'
      };
      
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          IPFSShareLinkService,
          { provide: IPFS_CONFIG, useValue: gatewayConfig }
        ]
      });
      const gatewayService = TestBed.inject(IPFSShareLinkService);
      
      const link = gatewayService.generateShareLink(mockCid);
      expect(link).toBe(`${gatewayConfig.gateway}/ipfs/${mockCid}`);
    });
  });
});