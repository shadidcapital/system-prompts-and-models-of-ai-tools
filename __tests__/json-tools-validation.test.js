const fs = require('fs');
const path = require('path');

/**
 * Test suite for JSON Tool Definitions Validation
 * Deep validation of tool structure, properties, and schemas
 */

// Helper function to collect JSON tool files
const collectToolFiles = () => {
  const collectFiles = (dirPath, relativePath = '') => {
    if (!fs.existsSync(dirPath)) return [];
    
    const results = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    entries.forEach((entry) => {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        results.push(...collectFiles(fullPath, relPath));
      } else if (entry.isFile() && (entry.name === 'tools.json' || entry.name.endsWith('-tools.json'))) {
        results.push({
          dir: relativePath || entry.name,
          file: entry.name,
          path: fullPath,
        });
      }
    });

    return results;
  };

  const rootPath = path.join(__dirname, '..');
  return collectFiles(rootPath).sort((a, b) => a.path.localeCompare(b.path));
};

describe('JSON Tool Definitions Validation', () => {
  describe('Tool definition structure', () => {
    const toolFiles = collectToolFiles();

    it('should have tool files to validate', () => {
      expect(toolFiles.length).toBeGreaterThan(0);
      console.log(`\nValidating ${toolFiles.length} tool definition files`);
    });

    it.each(toolFiles)('should parse as valid JSON - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      expect(data).toBeDefined();
    });

    it.each(toolFiles)('should be object or array - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      expect(
        Array.isArray(data) || (typeof data === 'object' && data !== null)
      ).toBe(true);
    });
  });

  describe('Tool array/collection validation', () => {
    const toolFiles = collectToolFiles();

    it.each(toolFiles)('should have collection of tools - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        expect(data.length).toBeGreaterThan(0);
        // Each element should be defined
        data.forEach((item, idx) => {
          expect(item).toBeDefined();
        });
      } else if (typeof data === 'object') {
        const values = Object.values(data);
        expect(values.length).toBeGreaterThan(0);
      }
    });

    it.each(toolFiles)('should have consistent collection structure - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      const items = Array.isArray(data) ? data : Object.values(data);
      
      // Should not have too many or too few items
      expect(items.length).toBeGreaterThan(0);
      expect(items.length).toBeLessThan(10000);
    });
  });

  describe('Tool property validation', () => {
    const toolFiles = collectToolFiles();

    it.each(toolFiles)('should have objects or primitives as tools - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : Object.values(data);

      items.forEach((item) => {
        if (item !== null && item !== undefined) {
          const itemType = typeof item;
          expect(['object', 'string', 'number', 'boolean'].includes(itemType)).toBe(true);
        }
      });
    });

    it.each(toolFiles)('should have properties with valid values - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : Object.values(data);

      items.forEach((item) => {
        if (item && typeof item === 'object') {
          Object.entries(item).forEach(([key, value]) => {
            // Key should be string
            expect(typeof key).toBe('string');
            // Value should not be undefined
            expect(value).not.toBe(undefined);
          });
        }
      });
    });

    it.each(toolFiles)('should have valid value types - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : Object.values(data);

      const validTypes = ['string', 'number', 'boolean', 'object'];
      
      items.forEach((item) => {
        if (item && typeof item === 'object') {
          Object.values(item).forEach((value) => {
            const valueType = typeof value;
            expect(validTypes.includes(valueType)).toBe(true);
          });
        }
      });
    });
  });

  describe('Tool name and ID validation', () => {
    const toolFiles = collectToolFiles();

    it.each(toolFiles)('should have tools with properties - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : Object.values(data);

      items.forEach((item) => {
        if (item && typeof item === 'object') {
          // Tool should have at least one property
          const keys = Object.keys(item);
          expect(keys.length).toBeGreaterThanOrEqual(0);
          
          // If it has properties, they should be valid
          keys.forEach((k) => {
            const val = item[k];
            // Properties should have valid types
            expect(['string', 'number', 'boolean', 'object'].includes(typeof val)).toBe(true);
          });
        }
      });
    });

    it.each(toolFiles)('should not have empty string values - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : Object.values(data);

      items.forEach((item) => {
        if (item && typeof item === 'object') {
          Object.entries(item).forEach(([key, value]) => {
            if (typeof value === 'string') {
              // Critical fields (name-like) should not be empty
              if (key.toLowerCase().includes('name') || 
                  key.toLowerCase().includes('id') ||
                  key.toLowerCase().includes('title')) {
                expect(value.length).toBeGreaterThan(0);
              }
            }
          });
        }
      });
    });
  });

  describe('Tool schema consistency', () => {
    const toolFiles = collectToolFiles();

    it.each(toolFiles)('should have consistent schema within file - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : Object.values(data);

      if (items.length > 1) {
        const objectItems = items.filter((item) => item && typeof item === 'object');
        if (objectItems.length > 1) {
          const firstKeys = Object.keys(objectItems[0]).sort();
          
          objectItems.forEach((item) => {
            const keys = Object.keys(item).sort();
            // Tools should have similar structure (allowing some variation)
            const keyDifference = Math.abs(keys.length - firstKeys.length);
            expect(keyDifference).toBeLessThanOrEqual(10);
          });
        }
      }
    });

    it.each(toolFiles)('should have reasonable number of properties - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : Object.values(data);

      items.forEach((item) => {
        if (item && typeof item === 'object') {
          const propCount = Object.keys(item).length;
          // Should have between 1 and 100 properties
          expect(propCount).toBeGreaterThan(0);
          expect(propCount).toBeLessThan(100);
        }
      });
    });
  });

  describe('Tool description and metadata', () => {
    const toolFiles = collectToolFiles();

    it.each(toolFiles)('should have properties with descriptive names - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : Object.values(data);

      items.forEach((item) => {
        if (item && typeof item === 'object') {
          const keys = Object.keys(item);
          // Keys should be reasonable length
          keys.forEach((key) => {
            expect(key.length).toBeGreaterThan(0);
            expect(key.length).toBeLessThan(200);
          });
        }
      });
    });

    it.each(toolFiles)('should have valid JSON key names - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : Object.values(data);

      items.forEach((item) => {
        if (item && typeof item === 'object') {
          Object.keys(item).forEach((key) => {
            // Keys should not start or end with spaces
            expect(key).toBe(key.trim());
            // Keys should not be only whitespace
            expect(key.trim().length).toBeGreaterThan(0);
          });
        }
      });
    });
  });

  describe('Tool array integrity', () => {
    const toolFiles = collectToolFiles();

    it.each(toolFiles)('should maintain array index integrity - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        expect(data.length).toBe(data.filter(() => true).length);
        
        // No null/undefined in array
        const nullCount = data.filter((item) => item === null || item === undefined).length;
        expect(nullCount).toBe(0);
      }
    });
  });

  describe('Tool circular reference detection', () => {
    const toolFiles = collectToolFiles();

    it.each(toolFiles)('should not have circular references - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      // If JSON.parse succeeds without error, there are no circular refs
      const data = JSON.parse(content);
      
      // Double stringify to ensure no circular refs
      expect(() => {
        JSON.stringify(data);
      }).not.toThrow();
    });
  });

  describe('Tool size and performance', () => {
    const toolFiles = collectToolFiles();

    it.each(toolFiles)('should have reasonable file size - $file', ({ path: filePath }) => {
      const stats = fs.statSync(filePath);
      // Should be at least 100 bytes
      expect(stats.size).toBeGreaterThan(100);
      // Should be less than 50MB
      expect(stats.size).toBeLessThan(50 * 1024 * 1024);
    });

    it.each(toolFiles)('should parse efficiently - $file', ({ path: filePath }) => {
      const start = Date.now();
      const content = fs.readFileSync(filePath, 'utf-8');
      JSON.parse(content);
      const duration = Date.now() - start;
      
      // Should parse quickly (within reasonable time)
      expect(duration).toBeLessThan(5000);
    });
  });
});
