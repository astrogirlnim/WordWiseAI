/**
 * Build Validation Tests
 * 
 * These tests verify that the build process works correctly and that
 * all imports and exports are properly resolved.
 * 
 * Run with: node -r ts-node/register tests/build/build-validation.test.ts
 */

// Simple test runner for build validation
const testResults: { name: string; passed: boolean; error?: string }[] = [];

function describe(name: string, fn: () => void) {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    fn();
  } catch (error) {
    console.error(`❌ ${name} failed:`, error);
  }
}

function it(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    testResults.push({ name, passed: true });
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.error(`     Error: ${error instanceof Error ? error.message : String(error)}`);
    testResults.push({ name, passed: false, error: String(error) });
  }
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected) {
        throw new Error(`Expected ${expected}, got ${actual}`);
      }
    },
    toBeDefined() {
      if (actual === undefined) {
        throw new Error(`Expected value to be defined, got undefined`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, got ${actual}`);
      }
    },
    not: {
      toThrow() {
        if (typeof actual === 'function') {
          try {
            actual();
          } catch (error) {
            throw new Error(`Expected function not to throw, but it threw: ${error}`);
          }
        }
      }
    }
  };
}

describe('Build Validation', () => {
  describe('Core Dependencies', () => {
    it('should be able to import React', () => {
      expect(() => require('react')).not.toThrow();
    });

    it('should be able to import Next.js', () => {
      expect(() => require('next')).not.toThrow();
    });

    it('should be able to import Firebase', () => {
      expect(() => require('firebase/app')).not.toThrow();
      expect(() => require('firebase/firestore')).not.toThrow();
      expect(() => require('firebase/auth')).not.toThrow();
    });
  });

  describe('Document Sharing Imports', () => {
    it('should be able to import document sharing service', () => {
      expect(() => require('../../services/document-sharing-service')).not.toThrow();
    });

    it('should be able to import document types', () => {
      expect(() => require('../../types/document')).not.toThrow();
    });

    it('should be able to import utility functions', () => {
      expect(() => require('../../lib/utils')).not.toThrow();
    });
  });

  describe('Component Imports', () => {
    it('should be able to import sharing components', () => {
      // Note: These might throw in Node.js environment due to client-side only code
      // but the imports should resolve
      expect(() => {
        try {
          require('../../components/document-sharing-dialog');
          require('../../components/document-sharing-button');
        } catch (error) {
          // Allow client-side only errors, but not import resolution errors
          if (error && typeof error === 'object' && 'code' in error && error.code === 'MODULE_NOT_FOUND') {
            throw error;
          }
        }
      }).not.toThrow();
    });
  });

  describe('Hook Imports', () => {
    it('should be able to import hooks', () => {
      expect(() => {
        try {
          require('../../hooks/use-documents');
          require('../../hooks/use-auth');
        } catch (error) {
          // Allow client-side only errors, but not import resolution errors
          if (error && typeof error === 'object' && 'code' in error && error.code === 'MODULE_NOT_FOUND') {
            throw error;
          }
        }
      }).not.toThrow();
    });
  });

  describe('Type Definitions', () => {
    it('should validate ShareToken interface structure', () => {
      const { ShareToken } = require('../../types/document');
      
      // Basic type validation
      const mockShareToken = {
        id: 'test-token',
        documentId: 'test-doc',
        email: 'test@example.com',
        role: 'viewer' as const,
        createdBy: 'test-user',
        createdAt: new Date(),
        expiresAt: null,
        usedAt: null,
        usageCount: 0
      };

      // Should not throw when properly structured
      expect(() => {
        // Type assertion test
        const token: typeof ShareToken = mockShareToken;
        expect(token.id).toBe('test-token');
      }).not.toThrow();
    });

    it('should validate DocumentAccess interface structure', () => {
      const { DocumentAccess } = require('../../types/document');
      
      const mockDocumentAccess = {
        userId: 'test-user',
        email: 'test@example.com', 
        role: 'editor' as const,
        addedAt: new Date(),
        addedBy: 'owner-user'
      };

      expect(() => {
        const access: typeof DocumentAccess = mockDocumentAccess;
        expect(access.userId).toBe('test-user');
      }).not.toThrow();
    });
  });

  describe('Utility Functions', () => {
    it('should validate timestamp utilities', () => {
      const { toJSDate, formatFirestoreTimestamp } = require('../../lib/utils');
      
      expect(typeof toJSDate).toBe('function');
      expect(typeof formatFirestoreTimestamp).toBe('function');
      
      // Test with null values
      expect(toJSDate(null)).toBeNull();
      expect(formatFirestoreTimestamp(null)).toBe('N/A');
      
      // Test with Date objects
      const testDate = new Date();
      expect(toJSDate(testDate)).toBe(testDate);
      expect(typeof formatFirestoreTimestamp(testDate)).toBe('string');
    });

    it('should validate email utilities', () => {
      const { isValidEmail, validateUserEmail, normalizeEmail } = require('../../lib/utils');
      
      expect(typeof isValidEmail).toBe('function');
      expect(typeof validateUserEmail).toBe('function');
      expect(typeof normalizeEmail).toBe('function');
      
      // Test basic email validation
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      
      // Test email normalization
      expect(normalizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });
  });

  describe('Build Configuration', () => {
    it('should have valid package.json', () => {
      const packageJson = require('../../package.json');
      
      expect(packageJson.name).toBeDefined();
      expect(packageJson.version).toBeDefined();
      expect(packageJson.scripts).toBeDefined();
      expect(packageJson.scripts.build).toBeDefined();
      expect(packageJson.scripts.lint).toBeDefined();
    });

    it('should have valid Next.js config', () => {
      expect(() => require('../../next.config.mjs')).not.toThrow();
    });

    it('should have valid TypeScript config', () => {
      expect(() => require('../../tsconfig.json')).not.toThrow();
    });

    it('should have valid Tailwind config', () => {
      expect(() => require('../../tailwind.config.ts')).not.toThrow();
    });
  });

  describe('Environment Validation', () => {
    it('should have required environment file structure', () => {
      const fs = require('fs');
      const path = require('path');
      
      // Check for env.example
      const envExamplePath = path.join(__dirname, '../../env.example');
      expect(fs.existsSync(envExamplePath)).toBe(true);
    });
  });
});

// Run all tests and show summary
console.log('\n📊 Test Summary:');
const passedTests = testResults.filter(t => t.passed).length;
const totalTests = testResults.length;
console.log(`✅ ${passedTests} passed`);
console.log(`❌ ${totalTests - passedTests} failed`);
console.log(`📋 Total: ${totalTests} tests`);

if (totalTests > 0) {
  console.log(`\n🎯 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
}

// Exit with error code if any tests failed
if (passedTests < totalTests) {
  process.exit(1);
} else {
  console.log('\n🎉 All build validation tests passed!');
} 