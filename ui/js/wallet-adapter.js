/*
  wallet-adapter.js
  Copied and adapted from PlantBuddy's services/suiWalletService.ts
  Provides Wallet Standard detection plus legacy fallbacks.
*/

const safeWindow = typeof window !== 'undefined' ? window : {};
const safeNavigator = typeof navigator !== 'undefined' ? navigator : {};
const textEncoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

const detectedStandardWallets = [];
let activeWalletAdapter = null;
let connectedWalletInfo = null;

function addStandardWallet(wallet) {
  if (!wallet) return;
  const exists = detectedStandardWallets.some((w) => w.name === wallet.name);
  if (!exists) {
    detectedStandardWallets.push(wallet);
  }
}

if (safeWindow && safeWindow.addEventListener) {
  safeWindow.addEventListener('wallet-standard:register-wallet', (event) => {
    try {
      const registerCallback = event?.detail;
      if (!registerCallback) return;
      if (typeof registerCallback === 'function') {
        registerCallback({
          register(wallet) {
            addStandardWallet(wallet);
          }
        });
      } else if (registerCallback.register && typeof registerCallback.register === 'function') {
        registerCallback.register((wallet) => addStandardWallet(wallet));
      }
    } catch (err) {
      console.warn('wallet-standard register error:', err);
    }
  });
}

function addWalletIfMissing(wallet, list) {
  if (!wallet) return;
  const exists = list.some((w) => w.name === wallet.name);
  if (!exists) list.push(wallet);
}

function getStandardWallets() {
  const all = [...detectedStandardWallets];
  try {
    if (safeNavigator?.wallets?.get) {
      const navWallets = safeNavigator.wallets.get();
      if (Array.isArray(navWallets)) navWallets.forEach((wallet) => addWalletIfMissing(wallet, all));
    } else if (typeof safeNavigator?.getWallets === 'function') {
      const navWallets = safeNavigator.getWallets();
      if (Array.isArray(navWallets)) navWallets.forEach((wallet) => addWalletIfMissing(wallet, all));
    }
  } catch (err) {
    console.warn('navigator wallet detection failed:', err);
  }
  return all;
}

function hasLegacyWallet() {
  return !!(safeWindow?.suiWallet || safeWindow?.suiet || safeWindow?.sui);
}

export function checkSuiWalletInstalled() {
  if (typeof window === 'undefined') return false;
  const standard = getStandardWallets().some((w) => (w.name || '').toLowerCase().includes('sui'));
  return standard || hasLegacyWallet();
}

async function waitForWallet(retries = 20, delay = 200) {
  for (let i = 0; i < retries; i++) {
    if (checkSuiWalletInstalled()) return true;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  return false;
}

export function listAvailableWallets() {
  const wallets = [];
  const standardWallets = getStandardWallets();

  standardWallets.forEach((wallet) => {
    const id = wallet.id || wallet.name?.toLowerCase().replace(/\s+/g, '-') || `standard-${wallets.length}`;
    wallets.push({
      id,
      name: wallet.name || wallet.id || 'Sui Wallet',
      type: 'standard',
      provider: wallet
    });
  });

  const legacySources = [
    { id: 'suiWallet', name: 'Sui Wallet (Legacy)', provider: safeWindow?.suiWallet },
    { id: 'suiet', name: 'Suiet', provider: safeWindow?.suiet },
    { id: 'sui', name: 'Sui Wallet', provider: safeWindow?.sui },
  ];

  legacySources.forEach((entry) => {
    if (entry.provider && !wallets.some((w) => w.id === entry.id)) {
      wallets.push({ id: entry.id, name: entry.name, type: 'legacy', provider: entry.provider });
    }
  });

  return wallets;
}

function toBytes(message) {
  if (message instanceof Uint8Array) return message;
  if (!textEncoder) throw new Error('TextEncoder not available');
  if (typeof message === 'string') return textEncoder.encode(message);
  return textEncoder.encode(JSON.stringify(message));
}

function toBase64(data) {
  if (typeof data === 'string') return data;
  if (data instanceof Uint8Array) {
    let binary = '';
    for (let i = 0; i < data.length; i++) {
      binary += String.fromCharCode(data[i]);
    }
    if (typeof btoa === 'function') {
      return btoa(binary);
    }
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(data).toString('base64');
    }
  }
  throw new Error('Unsupported transaction payload format');
}

function setConnectedWallet(address, meta = {}) {
  connectedWalletInfo = {
    id: meta.id || meta.name || 'sui-wallet',
    name: meta.name || 'Sui Wallet',
    address,
    adapter: activeWalletAdapter,
    type: meta.type || 'standard',
    account: activeWalletAdapter?.account || null,
  };

  if (typeof window !== 'undefined') {
    window.truthsignalWallet = connectedWalletInfo;
    window.dispatchEvent(new CustomEvent('truthsignal:wallet-connected', { detail: connectedWalletInfo }));
  }
}

function buildStandardAdapter(wallet, account) {
  return {
    type: 'standard',
    wallet,
    account,
    async signMessage(messageBytes) {
      if (wallet.features?.['sui:signMessage']?.signMessage) {
        return wallet.features['sui:signMessage'].signMessage({ message: messageBytes, account });
      }
      if (wallet.features?.['standard:signMessage']?.signMessage) {
        return wallet.features['standard:signMessage'].signMessage({ message: messageBytes, account });
      }
      throw new Error('signMessage not supported by this wallet');
    },
    async signAndExecuteTransactionBlock(input = {}) {
      if (wallet.features?.['sui:signAndExecuteTransactionBlock']?.signAndExecuteTransactionBlock) {
        return wallet.features['sui:signAndExecuteTransactionBlock'].signAndExecuteTransactionBlock({
          ...input,
          account,
          chain: wallet.chains?.[0]
        });
      }
      throw new Error('signAndExecuteTransactionBlock not supported by this wallet');
    }
  };
}

async function connectStandardWallet(targetWallet) {
  if (!targetWallet) throw new Error('Wallet not found');
  const features = targetWallet.features || {};

  if (features['standard:connect']?.connect) {
    const result = await features['standard:connect'].connect();
    const account = result?.accounts?.[0] || targetWallet.accounts?.[0];
    if (!account?.address) throw new Error('Wallet returned no accounts');
    activeWalletAdapter = buildStandardAdapter(targetWallet, account);
    return account.address;
  }

  if (features['sui:connect']?.connect) {
    const result = await features['sui:connect'].connect();
    const account = result?.accounts?.[0] || targetWallet.accounts?.[0];
    if (!account?.address) throw new Error('Wallet returned no accounts');
    activeWalletAdapter = buildStandardAdapter(targetWallet, account);
    return account.address;
  }

  const account = targetWallet.accounts?.[0];
  if (account?.address) {
    activeWalletAdapter = buildStandardAdapter(targetWallet, account);
    return account.address;
  }

  throw new Error('Wallet Standard connect features missing');
}

async function connectLegacyProvider(provider, id) {
  if (!provider) throw new Error('Wallet provider missing');

  if (provider.requestPermissions) {
    await provider.requestPermissions();
  }

  if (provider.connect) {
    const res = await provider.connect();
    if (res?.address) {
      activeWalletAdapter = provider;
      return res.address;
    }
    if (Array.isArray(res?.data) && res.data[0]) {
      activeWalletAdapter = provider;
      return res.data[0].address || res.data[0];
    }
  }

  if (provider.getAccounts) {
    const accounts = await provider.getAccounts();
    if (Array.isArray(accounts) && accounts.length > 0) {
      const address = accounts[0]?.address || accounts[0];
      activeWalletAdapter = provider;
      return address;
    }
  }

  if (provider.accounts && Array.isArray(provider.accounts) && provider.accounts[0]) {
    activeWalletAdapter = provider;
    return provider.accounts[0].address || provider.accounts[0];
  }

  throw new Error(`Unable to connect to wallet ${id}`);
}

export async function connectSuiWallet(preferredId) {
  const installed = await waitForWallet();
  if (!installed) {
    throw new Error('Sui wallet extension not found. Please install Sui Wallet or Suiet.');
  }

  const wallets = listAvailableWallets();
  if (wallets.length === 0) {
    throw new Error('No wallets detected');
  }

  const target = wallets.find((w) => w.id === preferredId) || wallets[0];
  let address = null;

  if (target.type === 'standard') {
    address = await connectStandardWallet(target.provider);
  } else {
    address = await connectLegacyProvider(target.provider, target.id);
  }

  if (!address) {
    throw new Error('Wallet returned no address');
  }

  setConnectedWallet(address, target);
  return { ok: true, address, wallet: connectedWalletInfo };
}

export async function disconnectSuiWallet() {
  activeWalletAdapter = null;
  connectedWalletInfo = null;

  if (typeof window !== 'undefined') {
    delete window.truthsignalWallet;
  }

  const standardWallets = getStandardWallets();
  for (const wallet of standardWallets) {
    const disconnectFeature = wallet.features?.['standard:disconnect']?.disconnect;
    if (disconnectFeature) {
      try {
        await disconnectFeature();
      } catch (err) {
        console.warn('standard:disconnect failed:', err);
      }
    }
  }

  if (safeWindow?.suiWallet?.disconnect) {
    try { await safeWindow.suiWallet.disconnect(); } catch (err) { console.warn('suiWallet disconnect failed', err); }
  }
  if (safeWindow?.suiet?.disconnect) {
    try { await safeWindow.suiet.disconnect(); } catch (err) { console.warn('suiet disconnect failed', err); }
  }
}

export function getWalletAdapter() {
  if (activeWalletAdapter) return activeWalletAdapter;
  if (safeWindow?.suiWallet) return safeWindow.suiWallet;
  if (safeWindow?.suiet) return safeWindow.suiet;
  if (safeWindow?.sui) return safeWindow.sui;
  return null;
}

export function getConnectedWalletInfo() {
  return connectedWalletInfo || safeWindow?.truthsignalWallet || null;
}

export async function signMessageWithWallet(message) {
  const adapter = getWalletAdapter();
  if (!adapter) {
    return { ok: false, error: 'connect wallet first' };
  }

  const messageBytes = toBytes(message);

  try {
    if (adapter.signMessage) {
      const resp = await adapter.signMessage(messageBytes);
      return formatSignature(resp);
    }

    if (adapter.features?.['sui:signMessage']?.signMessage) {
      const account = adapter.account || connectedWalletInfo?.account;
      const resp = await adapter.features['sui:signMessage'].signMessage({ message: messageBytes, account });
      return formatSignature(resp);
    }

    if (adapter.features?.['standard:signMessage']?.signMessage) {
      const account = adapter.account || connectedWalletInfo?.account;
      const resp = await adapter.features['standard:signMessage'].signMessage({ message: messageBytes, account });
      return formatSignature(resp);
    }

    if (adapter.request && typeof adapter.request === 'function') {
      const resp = await adapter.request({ method: 'sui_signMessage', params: [messageBytes] });
      return formatSignature(resp);
    }

    return { ok: false, error: 'Wallet does not support signMessage' };
  } catch (err) {
    console.error('signMessage failed:', err);
    return { ok: false, error: err?.message || 'signMessage failed' };
  }
}

export async function executeTransactionBlock(txBytes, options = {}) {
  const adapter = getWalletAdapter();
  if (!adapter) {
    return { ok: false, error: 'connect wallet first' };
  }

  let transactionBlock;
  try {
    transactionBlock = toBase64(txBytes);
  } catch (err) {
    return { ok: false, error: err.message || 'Invalid transaction block' };
  }

  try {
    if (typeof adapter.signAndExecuteTransactionBlock === 'function') {
      const resp = await adapter.signAndExecuteTransactionBlock({
        transactionBlock,
        options: options.options || { showEffects: true, showEvents: true },
      });
      return { ok: true, digest: resp?.digest || resp?.effects?.transactionDigest || null, raw: resp };
    }

    const suiFeature = adapter.features?.['sui:signAndExecuteTransactionBlock']?.signAndExecuteTransactionBlock;
    if (suiFeature) {
      const account = adapter.account || connectedWalletInfo?.account;
      const resp = await suiFeature({
        transactionBlock,
        account,
        chain: adapter.wallet?.chains?.[0],
        options: options.options || { showEffects: true, showEvents: true },
      });
      return { ok: true, digest: resp?.digest || resp?.effects?.transactionDigest || null, raw: resp };
    }

    if (adapter.request && typeof adapter.request === 'function') {
      const resp = await adapter.request({
        method: 'sui_signAndExecuteTransactionBlock',
        params: [{ transactionBlock, options: options.options || { showEffects: true, showEvents: true } }],
      });
      return { ok: true, digest: resp?.digest || null, raw: resp };
    }

    return { ok: false, error: 'Wallet does not support signAndExecuteTransactionBlock' };
  } catch (err) {
    console.error('executeTransactionBlock failed:', err);
    return { ok: false, error: err?.message || 'Failed to execute transaction' };
  }
}

function formatSignature(resp) {
  const signature = resp?.signature || resp?.signatureBytes || resp?.bytes || resp;
  if (!signature) {
    return { ok: false, error: 'signature missing from wallet response' };
  }
  return { ok: true, signature };
}

if (typeof window !== 'undefined') {
  window.truthsignalConnect = async (id) => connectSuiWallet(id);
  window.truthsignalSignMessage = async (message) => signMessageWithWallet(message);
  window.truthsignalExecuteTx = async (txBytes, opts) => executeTransactionBlock(txBytes, opts);
}

console.log('✅ wallet-adapter loaded (PlantBuddy service style)');
