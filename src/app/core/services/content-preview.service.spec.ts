import { TestBed } from '@angular/core/testing';
import { ContentPreviewService } from './content-preview.service';

describe('ContentPreviewService', () => {
  let service: ContentPreviewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContentPreviewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('detectContentType', () => {
    it('should detect PNG files', () => {
      const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
      expect(service.detectContentType(pngHeader)).toBe('image/png');
    });

    it('should detect JPEG files', () => {
      const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      expect(service.detectContentType(jpegHeader)).toBe('image/jpeg');
    });

    it('should detect GIF files', () => {
      const gifHeader = new Uint8Array([0x47, 0x49, 0x46, 0x38]);
      expect(service.detectContentType(gifHeader)).toBe('image/gif');
    });

    it('should detect PDF files', () => {
      const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
      expect(service.detectContentType(pdfHeader)).toBe('application/pdf');
    });

    it('should detect JSON content', () => {
      const jsonData = new TextEncoder().encode('{"test": "data"}');
      expect(service.detectContentType(jsonData)).toBe('application/json');
    });

    it('should detect plain text', () => {
      const textData = new TextEncoder().encode('Hello, world!');
      expect(service.detectContentType(textData)).toBe('text/plain');
    });

    it('should detect binary data', () => {
      const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0xff]);
      expect(service.detectContentType(binaryData)).toBe('application/octet-stream');
    });
  });

  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(service.formatFileSize(0)).toBe('0 Bytes');
    });

    it('should format bytes', () => {
      expect(service.formatFileSize(512)).toBe('512 Bytes');
    });

    it('should format kilobytes', () => {
      expect(service.formatFileSize(1024)).toBe('1 KB');
      expect(service.formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(service.formatFileSize(1048576)).toBe('1 MB');
      expect(service.formatFileSize(5242880)).toBe('5 MB');
    });

    it('should format gigabytes', () => {
      expect(service.formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('formatHashForDisplay', () => {
    it('should return short hashes unchanged', () => {
      expect(service.formatHashForDisplay('abc123', 10)).toBe('abc123');
    });

    it('should truncate long hashes with default length', () => {
      const longHash = 'abcdef1234567890abcdef1234567890';
      expect(service.formatHashForDisplay(longHash)).toBe('abcdef...34567890');
    });

    it('should truncate with custom length', () => {
      const longHash = 'abcdef1234567890abcdef1234567890';
      expect(service.formatHashForDisplay(longHash, 20)).toBe('abcdef...34567890');
    });
  });

  describe('generatePreview', () => {
    describe('text format', () => {
      it('should preview text content', () => {
        const data = new TextEncoder().encode('Hello, world!');
        expect(service.generatePreview(data, 'text')).toBe('Hello, world!');
      });

      it('should truncate long text', () => {
        const longText = 'a'.repeat(2000);
        const data = new TextEncoder().encode(longText);
        const preview = service.generatePreview(data, 'text');
        expect(preview.length).toBe(1003); // 1000 + '...'
        expect(preview.endsWith('...')).toBe(true);
      });

      it('should handle invalid UTF-8', () => {
        const data = new Uint8Array([0xff, 0xfe, 0xfd]);
        expect(service.generatePreview(data, 'text')).toBe('Unable to decode as text');
      });
    });

    describe('json format', () => {
      it('should preview and format JSON', () => {
        const data = new TextEncoder().encode('{"test":"data","count":42}');
        const preview = service.generatePreview(data, 'json');
        expect(preview).toContain('"test": "data"');
        expect(preview).toContain('"count": 42');
      });

      it('should handle invalid JSON', () => {
        const data = new TextEncoder().encode('not json');
        expect(service.generatePreview(data, 'json')).toBe('Invalid JSON');
      });
    });

    describe('hex format', () => {
      it('should preview as hex', () => {
        const data = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
        expect(service.generatePreview(data, 'hex')).toBe('48 65 6C 6C 6F');
      });

      it('should truncate long hex data', () => {
        const data = new Uint8Array(300).fill(0xff);
        const preview = service.generatePreview(data, 'hex');
        expect(preview.endsWith(' ...')).toBe(true);
        expect(preview.split(' ').length).toBe(257); // 256 bytes + '...'
      });
    });

    describe('base64 format', () => {
      it('should preview as base64', () => {
        const data = new TextEncoder().encode('Hello');
        expect(service.generatePreview(data, 'base64')).toBe('SGVsbG8=');
      });

      it('should truncate long base64 data', () => {
        const data = new Uint8Array(2000).fill(0x41);
        const preview = service.generatePreview(data, 'base64');
        expect(preview.endsWith('...')).toBe(true);
      });
    });
  });
});