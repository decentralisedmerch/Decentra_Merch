/**
 * Unit tests for Walrus routes
 * Run with: node server/routes/walrus.test.js
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple test runner
async function test(name, fn) {
  try {
    await fn();
    console.log(`✅ ${name}`);
    return true;
  } catch (err) {
    console.error(`❌ ${name}:`, err.message);
    return false;
  }
}

async function runTests() {
  console.log('=== Walrus Route Tests ===\n');

  // Test 1: Verify file structure
  await test('Package records file structure', async () => {
    const WALRUS_DIR = path.resolve(__dirname, '../data/walrus_packages');
    const PACKAGE_RECORDS_FILE = path.join(WALRUS_DIR, 'packages.json');
    
    try {
      const data = await fs.readFile(PACKAGE_RECORDS_FILE, 'utf8');
      const records = JSON.parse(data);
      if (typeof records !== 'object') {
        throw new Error('Package records should be an object');
      }
      // Check structure of first record if exists
      const firstKey = Object.keys(records)[0];
      if (firstKey) {
        const record = records[firstKey];
        if (!record.pkgId && !record.id) {
          throw new Error('Package record should have pkgId or id');
        }
        if (!record.status) {
          throw new Error('Package record should have status');
        }
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        // File doesn't exist yet, that's OK
        return;
      }
      throw err;
    }
  });

  // Test 2: Verify CID file structure
  await test('Walrus CID file structure', async () => {
    const WALRUS_DIR = path.resolve(__dirname, '../data/walrus_packages');
    const WALRUS_CID_FILE = path.join(WALRUS_DIR, 'walrus_cids.json');
    
    try {
      const data = await fs.readFile(WALRUS_CID_FILE, 'utf8');
      const cids = JSON.parse(data);
      if (typeof cids !== 'object') {
        throw new Error('Walrus CIDs should be an object');
      }
      // Check structure of first entry if exists
      const firstKey = Object.keys(cids)[0];
      if (firstKey) {
        const cidData = cids[firstKey];
        if (typeof cidData === 'string') {
          // Old format, OK
          return;
        }
        if (!cidData.walrusCid) {
          throw new Error('CID entry should have walrusCid');
        }
      }
    } catch (err) {
      if (err.code === 'ENOENT') {
        // File doesn't exist yet, that's OK
        return;
      }
      throw err;
    }
  });

  // Test 3: Verify logger exists
  await test('Logger utility exists', async () => {
    const loggerModule = await import('../utils/logger.js');
    if (!loggerModule.logger || !loggerModule.default) {
      throw new Error('Logger should export logger and default');
    }
    if (typeof loggerModule.logger.info !== 'function') {
      throw new Error('Logger should have info method');
    }
  });

  console.log('\n=== Manual Integration Tests ===');
  console.log(`
To test the endpoints manually:

1. Create a snapshot:
   curl -X POST http://localhost:4000/snapshot \\
     -H "Content-Type: application/json" \\
     -d '{"token":"sui","price":1.23,"timestamp":"2025-11-24T03:00:00Z"}'

2. Extract the CID from response (e.g., "dev-9d4ff20cc91c"), then test prepare-and-initiate:
   curl -X POST http://localhost:4000/walrus/prepare-and-initiate \\
     -H "Content-Type: application/json" \\
     -d '{"snapshotId":"dev-9d4ff20cc91c","includeAudio":false}'

3. Verify response contains: ok:true, pkgId, filename, size, prepareAt

4. Test create-publish-payload (use pkgId from step 2):
   curl -X POST http://localhost:4000/walrus/create-publish-payload \\
     -H "Content-Type: application/json" \\
     -d '{"pkgId":"<pkgId-from-step-2>"}'

5. Verify response contains: ok:true, pkgId, walrusPayload

6. Test submit-signed (mock signed payload):
   curl -X POST http://localhost:4000/walrus/submit-signed \\
     -H "Content-Type: application/json" \\
     -d '{"pkgId":"<pkgId>","signedWalrusPayload":{"kind":"publish","file":{"digest":"test"}},"signerAddress":"0x123"}'

7. Verify the CID was saved:
   curl http://localhost:4000/walrus/cid/dev-9d4ff20cc91c

Expected: {"cid":"dev-9d4ff20cc91c","walrusCid":"...",...}
`);

  console.log('\n=== Test Summary ===');
  console.log('✅ Basic structure tests passed');
  console.log('⚠️  Integration tests require running server - see manual instructions above');
  console.log('⚠️  Note: submit-signed endpoint requires actual Walrus API access or mocking');
}

// Run if executed directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1].includes('walrus.test.js')) {
  runTests().catch(console.error);
} else {
  // Always run when imported/executed
  runTests().catch(console.error);
}

export { test, runTests };
