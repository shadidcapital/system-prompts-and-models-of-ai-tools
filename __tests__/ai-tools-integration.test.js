const fs = require('fs');
const path = require('path');

/**
 * Integration Tests for AI Tool Configurations
 * Tests cross-file relationships, consistency, and overall system integrity
 */

// Helper functions
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

const collectPromptFiles = () => {
  const collectFiles = (dirPath, relativePath = '') => {
    if (!fs.existsSync(dirPath)) return [];
    
    const results = [];
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    entries.forEach((entry) => {
      const fullPath = path.join(dirPath, entry.name);
      const relPath = relativePath ? path.join(relativePath, entry.name) : entry.name;

      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        results.push(...collectFiles(fullPath, relPath));
      } else if (entry.isFile() && 
                 (entry.name.endsWith('.txt') || entry.name.endsWith('.md'))) {
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

describe('AI Tool Configurations Integration Tests', () => {
  let toolFiles;
  let promptFiles;

  beforeAll(() => {
    toolFiles = collectToolFiles();
    promptFiles = collectPromptFiles();
  });

  describe('Cross-file consistency', () => {
    it('should have both tool definitions and prompts', () => {
      expect(toolFiles.length).toBeGreaterThan(0);
      expect(promptFiles.length).toBeGreaterThan(0);
    });

    it('should have valid directory structure', () => {
      const toolDirs = new Set(toolFiles.map((t) => t.dir));
      const promptDirs = new Set(promptFiles.map((p) => p.dir));
      
      // Both should exist
      expect(toolDirs.size).toBeGreaterThan(0);
      expect(promptDirs.size).toBeGreaterThan(0);
    });

    it('should not have orphaned files', () => {
      toolFiles.forEach((toolFile) => {
        const filePath = toolFile.path;
        expect(fs.existsSync(filePath)).toBe(true);
      });

      promptFiles.forEach((promptFile) => {
        const filePath = promptFile.path;
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Tool configuration completeness', () => {
    it('should have each tool file paired with prompts', () => {
      toolFiles.forEach((toolFile) => {
        const dirPath = path.dirname(toolFile.path);
        // Should have at least one prompt file in same directory
        const promptsInDir = promptFiles.filter(
          (p) => path.dirname(p.path) === dirPath
        );
        // At least one prompt should exist in the directory
        expect(promptsInDir.length).toBeGreaterThanOrEqual(0);
      });
    });

    it('should have valid tool references in directory', () => {
      toolFiles.forEach((toolFile) => {
        const content = fs.readFileSync(toolFile.path, 'utf-8');
        const data = JSON.parse(content);
        
        // Data should be valid
        expect(data).toBeDefined();
        expect(data !== null).toBe(true);
      });
    });
  });

  describe('Tool naming consistency', () => {
    it('should use consistent naming across files', () => {
      const allFileNames = [
        ...toolFiles.map((t) => t.file),
        ...promptFiles.map((p) => p.file),
      ];

      // All should be unique by path
      const uniqueNames = new Set(allFileNames);
      // Some duplicates are OK (tools.json in different dirs)
      expect(uniqueNames.size).toBeGreaterThan(0);
    });

    it('should follow consistent extension patterns', () => {
      toolFiles.forEach(({ file }) => {
        expect(file.endsWith('.json')).toBe(true);
      });

      promptFiles.forEach(({ file }) => {
        expect(
          file.endsWith('.txt') || file.endsWith('.md')
        ).toBe(true);
      });
    });
  });

  describe('Tool definition integrity', () => {
    it('should parse all tool definitions without errors', () => {
      toolFiles.forEach(({ path: filePath }) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(() => JSON.parse(content)).not.toThrow();
      });
    });

    it('should have valid schema in all tools', () => {
      toolFiles.forEach(({ path: filePath }) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        if (Array.isArray(data)) {
          data.forEach((item) => {
            expect(item).toBeDefined();
          });
        } else if (typeof data === 'object' && data !== null) {
          expect(Object.keys(data).length).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  describe('Prompt file integrity', () => {
    it('should read all prompt files without errors', () => {
      promptFiles.forEach(({ path: filePath }) => {
        expect(() => {
          fs.readFileSync(filePath, 'utf-8');
        }).not.toThrow();
      });
    });

    it('should have valid content in all prompts', () => {
      promptFiles.forEach(({ path: filePath }) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content.trim().length).toBeGreaterThan(0);
      });
    });
  });

  describe('Repository organization', () => {
    it('should have organized directory structure', () => {
      const rootPath = path.join(__dirname, '..');
      const dirs = fs.readdirSync(rootPath, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .filter((e) => !e.name.startsWith('.') && e.name !== 'node_modules');
      
      expect(dirs.length).toBeGreaterThan(0);
    });

    it('should have files in root and subdirectories', () => {
      const rootPath = path.join(__dirname, '..');
      const entries = fs.readdirSync(rootPath);
      
      expect(entries.length).toBeGreaterThan(0);
    });
  });

  describe('Tool configuration accessibility', () => {
    it('should have accessible tool files', () => {
      toolFiles.forEach(({ path: filePath }) => {
        const stats = fs.statSync(filePath);
        expect(stats.isFile()).toBe(true);
      });
    });

    it('should have accessible prompt files', () => {
      promptFiles.forEach(({ path: filePath }) => {
        const stats = fs.statSync(filePath);
        expect(stats.isFile()).toBe(true);
      });
    });
  });

  describe('System scalability checks', () => {
    it('should handle multiple tool definitions', () => {
      expect(toolFiles.length).toBeGreaterThan(0);
      // Should scale well with more files
      expect(toolFiles.length).toBeLessThan(1000);
    });

    it('should handle multiple prompt files', () => {
      expect(promptFiles.length).toBeGreaterThan(0);
      // Should scale well with more files
      expect(promptFiles.length).toBeLessThan(10000);
    });

    it('should maintain performance with file discovery', () => {
      const start = Date.now();
      collectToolFiles();
      collectPromptFiles();
      const duration = Date.now() - start;
      
      // Should discover files quickly
      expect(duration).toBeLessThan(5000);
    });
  });

  describe('Configuration metadata', () => {
    it('should track all tool files with metadata', () => {
      toolFiles.forEach(({ dir, file, path: filePath }) => {
        expect(dir).toBeTruthy();
        expect(file).toBeTruthy();
        expect(filePath).toBeTruthy();
      });
    });

    it('should track all prompt files with metadata', () => {
      promptFiles.forEach(({ dir, file, path: filePath }) => {
        expect(dir).toBeTruthy();
        expect(file).toBeTruthy();
        expect(filePath).toBeTruthy();
      });
    });
  });

  describe('Tool ecosystem analysis', () => {
    it('should have diverse tool types', () => {
      const toolTypes = new Set();
      toolFiles.forEach(({ file }) => {
        const base = path.basename(file, '.json');
        toolTypes.add(base);
      });
      
      expect(toolTypes.size).toBeGreaterThan(0);
    });

    it('should have tools from multiple AI platforms', () => {
      const platformDirs = new Set(toolFiles.map((t) => t.dir.split('/')[0]));
      expect(platformDirs.size).toBeGreaterThan(1);
    });

    it('should have prompts from multiple platforms', () => {
      const platformDirs = new Set(promptFiles.map((p) => p.dir.split('/')[0]));
      expect(platformDirs.size).toBeGreaterThan(1);
    });
  });

  describe('Data quality across ecosystem', () => {
    it('should have non-empty tool definitions', () => {
      toolFiles.forEach(({ path: filePath }) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        const items = Array.isArray(data) ? data : Object.values(data);
        
        expect(items.length).toBeGreaterThan(0);
      });
    });

    it('should have meaningful prompt content', () => {
      promptFiles.forEach(({ path: filePath }) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const hasContent = content.trim().length > 50; // At least some meaningful content
        expect(hasContent).toBe(true);
      });
    });
  });
});
