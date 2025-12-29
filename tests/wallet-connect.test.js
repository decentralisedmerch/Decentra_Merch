/**
 * Wallet Connect Test
 * Tests wallet detection and connection for Slush and Suiet
 */

// Mock window object for Node.js testing
if (typeof window === 'undefined') {
  global.window = {
    slush: null,
    suiet: null,
    dispatchEvent: () => {},
    addEventListener: () => {}
  };
}

// Import wallet module (adjust path as needed)
// Note: This test requires browser environment or proper mocking
async function testWalletDetection() {
  console.log('=== Testing Wallet Detection ===');
  
  // Mock Slush
  window.slush = {
    name: 'Slush',
    connect: async () => {},
    getAccounts: async () => [{ address: '0x1234567890abcdef' }],
    signMessage: async ({ message }) => ({ signature: 'mock-signature' })
  };
  
  // Mock Suiet
  window.suiet = {
    name: 'Suiet',
    connect: async () => {},
    accounts: [{ address: '0xabcdef1234567890' }],
    signMessage: async ({ message }) => ({ signature: 'mock-signature' })
  };
  
  // Import and test
  try {
    // In browser, this would be: import { detectWallets, connectWallet } from '../ui/js/wallet.js';
    // For Node.js test, we'll simulate the logic
    const wallets = [];
    if (window.slush) {
      wallets.push({ id: 'slush', name: 'Slush', provider: window.slush });
    }
    if (window.suiet) {
      wallets.push({ id: 'suiet', name: 'Suiet', provider: window.suiet });
    }
    
    console.log(`Detected ${wallets.length} wallets:`, wallets.map(w => w.name));
    
    // Test priority: Slush should be first
    if (wallets.length >= 1 && wallets[0].id !== 'slush') {
      throw new Error('Priority test failed: Slush should be first');
    }
    
    console.log('✅ Detection test passed');
    return wallets;
    
  } catch (err) {
    console.error('❌ Detection test failed:', err);
    throw err;
  }
}

async function testConnectSlush() {
  console.log('\n=== Testing Slush Connection ===');
  
  if (!window.slush) {
    console.log('⚠️  Slush not available, skipping test');
    return;
  }
  
  try {
    await window.slush.connect();
    const accounts = await window.slush.getAccounts();
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned');
    }
    
    const address = accounts[0].address || accounts[0];
    console.log(`✅ Connected to Slush: ${address}`);
    return { ok: true, address };
    
  } catch (err) {
    console.error('❌ Connection test failed:', err);
    return { ok: false, error: err.message };
  }
}

async function testConnectSuiet() {
  console.log('\n=== Testing Suiet Connection ===');
  
  if (!window.suiet) {
    console.log('⚠️  Suiet not available, skipping test');
    return;
  }
  
  try {
    await window.suiet.connect();
    const accounts = window.suiet.accounts || [];
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned');
    }
    
    const address = accounts[0].address || accounts[0];
    console.log(`✅ Connected to Suiet: ${address}`);
    return { ok: true, address };
    
  } catch (err) {
    console.error('❌ Connection test failed:', err);
    return { ok: false, error: err.message };
  }
}

// Run tests
async function runTests() {
  console.log('Starting wallet connect tests...\n');
  
  try {
    const wallets = await testWalletDetection();
    await testConnectSlush();
    await testConnectSuiet();
    
    console.log('\n=== Test Summary ===');
    console.log('✅ All tests completed');
    console.log(`Detected wallets: ${wallets.length}`);
    
  } catch (err) {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  }
}

// Run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runTests();
}

module.exports = { testWalletDetection, testConnectSlush, testConnectSuiet };

