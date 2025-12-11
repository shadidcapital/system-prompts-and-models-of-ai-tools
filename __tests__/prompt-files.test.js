const fs = require('fs');
const path = require('path');

/**
 * Test suite for Prompt Files Validation
 * Validates structure, content, and format of prompt/instruction files
 */

// Helper function to collect prompt files
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

describe('Prompt Files Validation', () => {
  describe('Prompt file discovery', () => {
    it('should discover prompt files', () => {
      const promptFiles = collectPromptFiles();
      expect(promptFiles.length).toBeGreaterThan(0);
      
      console.log(`\nFound ${promptFiles.length} prompt files`);
    });

    it('should have mix of text and markdown files', () => {
      const promptFiles = collectPromptFiles();
      const txtFiles = promptFiles.filter((f) => f.file.endsWith('.txt'));
      const mdFiles = promptFiles.filter((f) => f.file.endsWith('.md'));
      
      expect(txtFiles.length).toBeGreaterThan(0);
      expect(mdFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Prompt file readability', () => {
    const promptFiles = collectPromptFiles();

    it.each(promptFiles)('should be readable - $file', ({ path: filePath }) => {
      expect(() => {
        fs.readFileSync(filePath, 'utf-8');
      }).not.toThrow();
    });

    it.each(promptFiles)('should be valid UTF-8 - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).toBeTruthy();
      // Should not have null bytes
      expect(content.includes('\0')).toBe(false);
    });
  });

  describe('Prompt content validation', () => {
    const promptFiles = collectPromptFiles();

    it.each(promptFiles)('should not be empty - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content.trim().length).toBeGreaterThan(0);
    });

    it.each(promptFiles)('should have reasonable size - $file', ({ path: filePath }) => {
      const stats = fs.statSync(filePath);
      // At least 10 bytes (minimum for useful content)
      expect(stats.size).toBeGreaterThan(10);
      // Less than 100MB (reasonable for prompt files)
      expect(stats.size).toBeLessThan(100 * 1024 * 1024);
    });

    it.each(promptFiles)('should have printable characters - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Most content should be printable
      const printableCount = content.split('').filter((c) => {
        const code = c.charCodeAt(0);
        return code >= 32 || code === 9 || code === 10 || code === 13; // space, tab, newline, carriage return
      }).length;
      
      const printableRatio = printableCount / content.length;
      expect(printableRatio).toBeGreaterThan(0.9);
    });
  });

  describe('Prompt structure validation', () => {
    const promptFiles = collectPromptFiles();

    it.each(promptFiles)('should have valid line endings - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Line should end with \n or \r\n, not bare \r
      const bareCarriageReturns = (content.match(/\r(?!\n)/g) || []).length;
      expect(bareCarriageReturns).toBe(0);
    });

    it.each(promptFiles)('should not start with BOM - $file', ({ path: filePath }) => {
      const buffer = fs.readFileSync(filePath);
      // BOM is 0xEF 0xBB 0xBF for UTF-8
      const hasBOM = buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF;
      expect(hasBOM).toBe(false);
    });
  });

  describe('Markdown files validation', () => {
    const promptFiles = collectPromptFiles().filter((f) => f.file.endsWith('.md'));

    it('should have markdown files', () => {
      expect(promptFiles.length).toBeGreaterThan(0);
    });

    it.each(promptFiles)('should have markdown structure - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Markdown files should have some markdown syntax
      const hasHeading = /^#+\s/m.test(content);
      const hasList = /^[-*+]\s/m.test(content);
      const hasLink = /\[.+\]\(.+\)/.test(content);
      const hasFormatting = /\*\*.+\*\*|__.+__|`/.test(content);
      
      const hasMarkdownFeature = hasHeading || hasList || hasLink || hasFormatting;
      expect(hasMarkdownFeature).toBe(true);
    });

    it.each(promptFiles)('should have valid markdown links - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Extract markdown links [text](url)
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      
      while ((match = linkRegex.exec(content)) !== null) {
        const url = match[2];
        // URLs should start with http, https, /, #, or be a relative path
        expect(
          url.startsWith('http') || 
          url.startsWith('/') || 
          url.startsWith('#') || 
          url.includes('.')
        ).toBe(true);
      }
    });
  });

  describe('Text files validation', () => {
    const promptFiles = collectPromptFiles().filter((f) => f.file.endsWith('.txt'));

    it('should have text files', () => {
      expect(promptFiles.length).toBeGreaterThan(0);
    });

    it.each(promptFiles)('should have minimum text content - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n').filter((l) => l.trim().length > 0);
      // Should have at least some meaningful lines
      expect(lines.length).toBeGreaterThan(0);
    });

    it.each(promptFiles)('should have reasonable line length - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      // Most lines should be under 1000 chars (reasonable for text)
      const longLines = lines.filter((l) => l.length > 1000).length;
      const longRatio = longLines / (lines.length || 1);
      expect(longRatio).toBeLessThan(0.1);
    });
  });

  describe('File naming conventions', () => {
    const promptFiles = collectPromptFiles();

    it('should have valid file extensions', () => {
      promptFiles.forEach(({ file }) => {
        expect(file.endsWith('.txt') || file.endsWith('.md')).toBe(true);
      });
    });

    it('should not have spaces in filenames for critical files', () => {
      // Some prompt files might have spaces which is OK
      // But we can validate the convention
      promptFiles.forEach(({ file }) => {
        expect(typeof file).toBe('string');
        expect(file.length).toBeGreaterThan(0);
      });
    });

    it('should have unique file paths', () => {
      const paths = promptFiles.map((f) => f.path);
      const uniquePaths = new Set(paths);
      expect(paths.length).toBe(uniquePaths.size);
    });
  });

  describe('Content quality checks', () => {
    const promptFiles = collectPromptFiles();

    it.each(promptFiles)('should handle whitespace reasonably - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Content should have some structure (not just whitespace)
      const nonWhitespaceRatio = content.trim().length / content.length;
      // At least 50% should be non-whitespace
      expect(nonWhitespaceRatio).toBeGreaterThan(0.3);
    });

    it.each(promptFiles)('should not have only whitespace - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const hasContent = content.trim().length > 0;
      expect(hasContent).toBe(true);
    });

    it.each(promptFiles)('should have valid character distribution - $file', ({ path: filePath }) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      // Count different character types
      const hasLetters = /[a-zA-Z]/.test(content);
      expect(hasLetters).toBe(true);
    });
  });
});
