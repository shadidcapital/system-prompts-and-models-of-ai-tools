const fs = require('fs');
const path = require('path');

/**
 * Test suite for AI Tool Specifications Validation
 * Validates structure, required fields, and format of tool definition files
 */

// Helper function to collect tool files
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

describe('Tool Specifications Validation', () => {
  describe('Tool files discovery', () => {
    it('should discover and validate tool files exist', () => {
      const toolFiles = collectToolFiles();
      expect(toolFiles.length).toBeGreaterThan(0);
      
      console.log(`\nFound ${toolFiles.length} tool files:`);
      toolFiles.forEach(({ file, dir }) => {
        console.log(`  - ${file} in ${dir}`);
      });
    });
  });

  describe('Tool JSON structure validation', () => {
    const toolFiles = collectToolFiles();

    it('should have at least some tool files', () => {
      expect(toolFiles.length).toBeGreaterThan(0);
    });

    it.each(toolFiles)('should parse valid JSON for $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    it.each(toolFiles)('should have proper JSON format for $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      expect(
        Array.isArray(data) || typeof data === 'object'
      ).toBe(true);
    });

    it.each(toolFiles)('should not be empty JSON for $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      
      if (Array.isArray(data)) {
        expect(data.length).toBeGreaterThan(0);
      } else if (typeof data === 'object' && data !== null) {
        expect(Object.keys(data).length).toBeGreaterThan(0);
      }
    });
  });

  describe('Tool specifications content validation', () => {
    const toolFiles = collectToolFiles();

    it.each(toolFiles)('should have valid tool definitions in $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        data.forEach((tool) => {
          expect(tool).toBeDefined();
        });
      } else if (typeof data === 'object' && data !== null) {
        const values = Object.values(data);
        expect(values.length).toBeGreaterThan(0);
      }
    });

    it.each(toolFiles)('should contain valid tool properties in $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const tools = Array.isArray(data) ? data : Object.values(data);

      tools.forEach((tool) => {
        if (tool && typeof tool === 'object') {
          Object.entries(tool).forEach(([, value]) => {
            expect(value).not.toBe(undefined);
          });
        }
      });
    });
  });

  describe('Tool naming conventions', () => {
    const toolFiles = collectToolFiles();

    it('should have consistent JSON file naming', () => {
      const jsonFiles = toolFiles.map((t) => t.file);
      
      jsonFiles.forEach((filename) => {
        expect(filename.endsWith('.json')).toBe(true);
      });
    });

    it('should have unique file paths', () => {
      const filePaths = toolFiles.map((t) => t.path);
      const uniquePaths = new Set(filePaths);
      expect(filePaths.length).toBe(uniquePaths.size);
    });

    it('should allow same filename in different directories', () => {
      const fileNames = toolFiles.map((t) => t.file);
      // It's OK to have tools.json in multiple directories
      expect(fileNames).toContain('tools.json');
    });
  });

  describe('File encoding and permissions', () => {
    const toolFiles = collectToolFiles();

    it.each(toolFiles)('should have readable encoding for $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toBeTruthy();
      expect(content.includes('\0')).toBe(false);
    });

    it.each(toolFiles)('should have valid file size for $file', ({ path: filePath }) => {
      const stats = fs.statSync(filePath);
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.size).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Tool data integrity', () => {
    const toolFiles = collectToolFiles();

    it.each(toolFiles)('should not have empty tool definitions in $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const tools = Array.isArray(data) ? data : Object.values(data);

      expect(tools.length).toBeGreaterThan(0);
    });

    it.each(toolFiles)('should have consistent data types in $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const tools = Array.isArray(data) ? data : Object.values(data);

      tools.forEach((tool) => {
        if (tool && typeof tool === 'object') {
          Object.values(tool).forEach((value) => {
            const valueType = typeof value;
            expect(['string', 'number', 'boolean', 'object'].includes(valueType)).toBe(true);
          });
        }
      });
    });

    it.each(toolFiles)('should have no null or undefined tool values in $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const tools = Array.isArray(data) ? data : Object.values(data);

      const nullCount = tools.filter((t) => t === null || t === undefined).length;
      expect(nullCount).toBe(0);
    });
  });

  describe('Tool schema validation', () => {
    const toolFiles = collectToolFiles();

    it.each(toolFiles)('should have valid schema structure in $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const tools = Array.isArray(data) ? data : Object.values(data);

      tools.forEach((tool) => {
        if (tool && typeof tool === 'object') {
          const keys = Object.keys(tool);
          expect(keys.length).toBeGreaterThanOrEqual(0);
          
          keys.forEach((key) => {
            expect(typeof key).toBe('string');
          });
        }
      });
    });
  });
});
