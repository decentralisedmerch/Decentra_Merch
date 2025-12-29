/**
 * TruthSignal Wallet Bridge
 * Direct wallet detection and connection (no CDN dependencies)
 * Priority: Slush > Suiet > Others
 */

// Global wallet state
let connectedWallet = null;
let connectedAccount = null;

/**
 * Detect available wallets directly from window objects
 * Priority: Slush > Suiet > Others
 */
export async function detectWallets() {
  try {
    // Wait for wallet extensions to register
    await new Promise(resolve => setTimeout(resolve, 500));

    const wallets = [];
    
    // Priority 1: Slush
    if (window.slush) {
      wallets.push({ 
        id: 'slush', 
        name: 'Slush', 
        icon: '', 
        wallet: window.slush 
      });
    }
    
    // Priority 2: Suiet
    if (window.suiet) {
      wallets.push({ 
        id: 'suiet', 
        name: 'Suiet', 
        icon: '', 
        wallet: window.suiet 
      });
    }
    
    // Other wallets
    if (window.suiWallet) {
      wallets.push({ 
        id: 'sui-wallet', 
        name: 'Sui Wallet', 
        icon: '', 
        wallet: window.suiWallet 
      });
    }
    if (window.nightly) {
      wallets.push({ 
        id: 'nightly', 
        name: 'Nightly', 
        icon: '', 
        wallet: window.nightly 
      });
    }
    if (window.ethos) {
      wallets.push({ 
        id: 'ethos', 
        name: 'Ethos', 
        icon: '', 
        wallet: window.ethos 
      });
    }
    if (window.phantom?.sui) {
      wallets.push({ 
        id: 'phantom', 
        name: 'Phantom', 
        icon: '', 
        wallet: window.phantom.sui 
      });
    }
    if (window.backpack?.sui) {
      wallets.push({ 
        id: 'backpack', 
        name: 'Backpack', 
        icon: '', 
        wallet: window.backpack.sui 
      });
    }

    console.log('✅ Detected wallets:', wallets.length, wallets.map(w => w.name));
    return wallets;
  } catch (e) {
    console.error('Wallet detect error:', e);
    return [];
  }
}

/**
 * Connect to a wallet
 */
export async function connectWallet(walletObj) {
  try {
    const wallet = walletObj.wallet || walletObj;
    const walletId = walletObj.id || wallet.name?.toLowerCase();

    console.log('Connecting to wallet:', walletId, wallet);

    let account = null;
    let address = null;

    // Try wallet-standard API first
    if (wallet.features && wallet.features['standard:connect']) {
      try {
        const connectFeature = wallet.features['standard:connect'];
        const result = await connectFeature.connect();
        account = result.accounts?.[0];
        address = account?.address;
      } catch (e) {
        console.warn('standard:connect failed, trying direct methods:', e);
      }
    }

    // Fallback: Direct wallet methods
    if (!address) {
      // Slush
      if (walletId === 'slush' && wallet.connect) {
        try {
          await wallet.connect();
          const accounts = await wallet.getAccounts();
          account = accounts?.[0];
          address = account?.address || account;
        } catch (e) {
          console.error('Slush connect error:', e);
          return { ok: false, error: e?.message || 'Slush connection failed' };
        }
      }
      // Suiet
      else if (walletId === 'suiet' && wallet.connect) {
        try {
          await wallet.connect();
          const accounts = wallet.accounts || [];
          account = accounts?.[0];
          address = account?.address || account;
        } catch (e) {
          console.error('Suiet connect error:', e);
          return { ok: false, error: e?.message || 'Suiet connection failed' };
        }
      }
      // Generic wallet-standard wallet
      else if (wallet.connect && typeof wallet.connect === 'function') {
        try {
          await wallet.connect();
          if (wallet.accounts && wallet.accounts.length > 0) {
            account = wallet.accounts[0];
            address = account?.address || account;
          } else if (wallet.getAccounts) {
            const accounts = await wallet.getAccounts();
            account = accounts?.[0];
            address = account?.address || account;
          }
        } catch (e) {
          console.error('Generic connect error:', e);
          return { ok: false, error: e?.message || 'Connection failed' };
        }
      }
    }

    if (!address) {
      return { ok: false, error: 'Wallet returned no address' };
    }

    // Store connection
    connectedWallet = wallet;
    connectedAccount = account || { address };

    window.truthsignalWallet = {
      id: walletId,
      name: walletObj.name || wallet.name || walletId,
      address: address,
      wallet: wallet,
      account: connectedAccount,
    };

    window.dispatchEvent(new CustomEvent('truthsignal:wallet-connected', {
      detail: window.truthsignalWallet
    }));

    console.log('✅ Connected:', walletObj.name, address);
    return { ok: true, address: address, account: connectedAccount };
  } catch (e) {
    console.error('Connection error:', e);
    return { ok: false, error: e?.message || 'Connection failed' };
  }
}

/**
 * Sign a message using the connected wallet
 */
export async function signMessage(message) {
  try {
    if (!connectedWallet || !connectedAccount) {
      const w = getConnectedWallet();
      if (w) {
        connectedWallet = w.wallet;
        connectedAccount = w.account || { address: w.address };
      } else {
        throw new Error('No wallet connected');
      }
    }

    const wallet = connectedWallet;
    const account = connectedAccount;

    const messageBytes = typeof message === 'string' 
      ? new TextEncoder().encode(message)
      : message;

    // Try wallet-standard signMessage
    if (wallet.features && wallet.features['sui:signMessage']) {
      try {
        const signFeature = wallet.features['sui:signMessage'];
        const result = await signFeature.signMessage({
          message: messageBytes,
          account: account,
        });
        return {
          ok: true,
          signature: result.signature || result.signatureBytes || result.bytes,
          messageBytes: messageBytes,
        };
      } catch (e) {
        console.warn('sui:signMessage failed, trying direct methods:', e);
      }
    }

    // Fallback: Direct signMessage methods
    if (wallet.signMessage && typeof wallet.signMessage === 'function') {
      try {
        const result = await wallet.signMessage({ message: messageBytes });
        return {
          ok: true,
          signature: result.signature || result.signatureBytes || result.bytes || result,
          messageBytes: messageBytes,
        };
      } catch (e) {
        console.error('Direct signMessage error:', e);
        return { ok: false, error: e?.message || 'Signing failed' };
      }
    }

    throw new Error('Wallet does not support message signing');
  } catch (e) {
    console.error('Sign error:', e);
    return { ok: false, error: e?.message || 'Signing failed' };
  }
}

/**
 * Get currently connected wallet
 */
export function getConnectedWallet() {
  return window.truthsignalWallet || null;
}

// Expose global functions for UI
window.truthsignalWalletConnect = async () => {
  const wallets = await detectWallets();
  if (wallets.length === 0) {
    return { ok: false, error: 'No wallets detected' };
  }
  // Connect to first wallet (Slush if available)
  return await connectWallet(wallets[0]);
};

window.truthsignalWalletSign = async (payload) => {
  const message = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return await signMessage(message);
};

console.log('✅ Wallet bridge loaded (direct detection mode)');
