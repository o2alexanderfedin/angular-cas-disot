import { TestBed } from '@angular/core/testing';
import { LocalStorageService } from './local-storage.service';

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('write', () => {
    it('should write data to storage', async () => {
      const path = 'test/file.txt';
      const data = new TextEncoder().encode('Hello, World!');

      await service.write(path, data);

      const result = await service.read(path);
      expect(result).toEqual(data);
    });

    it('should overwrite existing data', async () => {
      const path = 'test/file.txt';
      const data1 = new TextEncoder().encode('First data');
      const data2 = new TextEncoder().encode('Second data');

      await service.write(path, data1);
      await service.write(path, data2);

      const result = await service.read(path);
      expect(result).toEqual(data2);
    });

    it('should handle empty data', async () => {
      const path = 'test/empty.txt';
      const data = new Uint8Array(0);

      await service.write(path, data);

      const result = await service.read(path);
      expect(result).toEqual(data);
      expect(result.length).toBe(0);
    });

    it('should handle paths with special characters', async () => {
      const path = 'test/special!@#$%^&*()_+-={}[]|:";\'<>?,./file.txt';
      const data = new TextEncoder().encode('Special path data');

      await service.write(path, data);

      const result = await service.read(path);
      expect(result).toEqual(data);
    });
  });

  describe('read', () => {
    it('should read existing data', async () => {
      const path = 'test/file.txt';
      const data = new TextEncoder().encode('Test data');

      await service.write(path, data);
      const result = await service.read(path);

      expect(result).toEqual(data);
    });

    it('should throw error for non-existent path', async () => {
      const path = 'non/existent/file.txt';

      await expectAsync(service.read(path))
        .toBeRejectedWithError('File not found: non/existent/file.txt');
    });
  });

  describe('exists', () => {
    it('should return true for existing path', async () => {
      const path = 'test/file.txt';
      const data = new TextEncoder().encode('Test data');

      await service.write(path, data);
      const exists = await service.exists(path);

      expect(exists).toBeTrue();
    });

    it('should return false for non-existent path', async () => {
      const path = 'non/existent/file.txt';

      const exists = await service.exists(path);

      expect(exists).toBeFalse();
    });
  });

  describe('delete', () => {
    it('should delete existing file', async () => {
      const path = 'test/file.txt';
      const data = new TextEncoder().encode('Test data');

      await service.write(path, data);
      expect(await service.exists(path)).toBeTrue();

      await service.delete(path);
      expect(await service.exists(path)).toBeFalse();
    });

    it('should not throw error for non-existent path', async () => {
      const path = 'non/existent/file.txt';

      await expectAsync(service.delete(path)).toBeResolved();
    });
  });

  describe('list', () => {
    it('should return empty array for empty storage', async () => {
      const paths = await service.list();

      expect(paths).toEqual([]);
    });

    it('should return all stored paths', async () => {
      const data = new TextEncoder().encode('Test data');
      const expectedPaths = [
        'test/file1.txt',
        'test/file2.txt',
        'other/file3.txt'
      ];

      for (const path of expectedPaths) {
        await service.write(path, data);
      }

      const paths = await service.list();

      expect(paths.length).toBe(3);
      expect(paths).toContain('test/file1.txt');
      expect(paths).toContain('test/file2.txt');
      expect(paths).toContain('other/file3.txt');
    });

    it('should update after deletions', async () => {
      const data = new TextEncoder().encode('Test data');
      
      await service.write('file1.txt', data);
      await service.write('file2.txt', data);
      await service.write('file3.txt', data);

      await service.delete('file2.txt');

      const paths = await service.list();

      expect(paths.length).toBe(2);
      expect(paths).toContain('file1.txt');
      expect(paths).toContain('file3.txt');
      expect(paths).not.toContain('file2.txt');
    });
  });

  describe('clear', () => {
    it('should remove all stored data', async () => {
      const data = new TextEncoder().encode('Test data');
      
      await service.write('file1.txt', data);
      await service.write('file2.txt', data);
      await service.write('file3.txt', data);

      expect((await service.list()).length).toBe(3);

      await service.clear();

      expect((await service.list()).length).toBe(0);
    });

    it('should work on empty storage', async () => {
      await expectAsync(service.clear()).toBeResolved();
      expect((await service.list()).length).toBe(0);
    });
  });

  describe('getSize', () => {
    it('should return 0 for empty storage', async () => {
      const size = await service.getSize();
      expect(size).toBe(0);
    });

    it('should return total size of all stored data', async () => {
      await service.write('file1.txt', new TextEncoder().encode('Hello')); // 5 bytes
      await service.write('file2.txt', new TextEncoder().encode('World!')); // 6 bytes
      await service.write('file3.txt', new Uint8Array(10)); // 10 bytes

      const size = await service.getSize();
      expect(size).toBe(21); // 5 + 6 + 10
    });

    it('should update size after deletions', async () => {
      await service.write('file1.txt', new Uint8Array(100));
      await service.write('file2.txt', new Uint8Array(200));
      
      expect(await service.getSize()).toBe(300);

      await service.delete('file1.txt');
      
      expect(await service.getSize()).toBe(200);
    });

    it('should return 0 after clear', async () => {
      await service.write('file1.txt', new Uint8Array(100));
      await service.write('file2.txt', new Uint8Array(200));
      
      await service.clear();
      
      expect(await service.getSize()).toBe(0);
    });
  });

  describe('concurrent operations', () => {
    it('should handle concurrent writes', async () => {
      const promises = [];
      
      for (let i = 0; i < 10; i++) {
        const path = `file${i}.txt`;
        const data = new TextEncoder().encode(`Data ${i}`);
        promises.push(service.write(path, data));
      }

      await Promise.all(promises);

      const paths = await service.list();
      expect(paths.length).toBe(10);
    });

    it('should handle concurrent reads', async () => {
      const path = 'shared.txt';
      const data = new TextEncoder().encode('Shared data');
      
      await service.write(path, data);

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(service.read(path));
      }

      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toEqual(data);
      });
    });
  });

  describe('memory isolation', () => {
    it('should isolate storage between service instances', async () => {
      const service1 = new LocalStorageService();
      const service2 = new LocalStorageService();
      const data = new TextEncoder().encode('Test data');

      await service1.write('file.txt', data);

      expect(await service1.exists('file.txt')).toBeTrue();
      expect(await service2.exists('file.txt')).toBeFalse();
    });
  });
});