# Wallet Detection & Connection Implementation Summary

## Files Changed

1. **Created: `ui/js/wallet.js`**
   - Centralized wallet detection and connection logic
   - Exports: `detectWallets()`, `connectWallet()`, `getSelected()`
   - Implements priority order: Slush → Suiet → Nightly → Sui Wallet → Phantom → Ethos → generic
   - Includes stub for `window.truthsignalWalletSign`

2. **Updated: `ui/index.html`**
   - Removed old wallet detection code
   - Imports wallet module: `import { detectWallets, connectWallet, getSelected } from './js/wallet.js'`
   - Updated `checkSuiWallet()` to use new module
   - Added Connect buttons for each wallet
   - Added connection status display
   - Listens for `truthsignal:wallet-connected` event
   - Updated signing flow to use `getSelected()`

## Implementation Details

### Detection Priority
1. Slush (`window.slush`)
2. Suiet (`window.suiet`)
3. Nightly (`window.nightly`)
4. Sui Wallet (`window.sui`)
5. Phantom (`window.phantom.sui` or `window.phantom`)
6. Ethos (`window.ethos`)
7. Injected Sui (`window.injectedSui`)
8. Generic (`window.suiWallet`)
9. Wallet Standard wallets (via `window.getWallets()`)

### Connection Methods

**Slush:**
- Tries: `provider.connect()`, `provider.request({method: 'connect'})`, `provider.requestPermissions()`
- Gets accounts: `provider.getAccounts()`, `provider.request({method: 'sui_getAccounts'})`, `provider.accounts()`

**Suiet:**
- Tries: `provider.connect()`
- Gets accounts: `provider.accounts()`, `provider.getAccounts()`

**Wallet Standard:**
- Uses: `provider.features['standard:connect'].connect()`
- Gets accounts: `provider.features['sui:accounts'].getAccounts()`

**Generic:**
- Tries: `provider.connect()`, `provider.requestPermissions()`
- Gets accounts: `provider.getAccounts()`, `provider.accounts()`, `provider.request({method: 'sui_getAccounts'})`

### Exposed Helper

```javascript
window.truthsignalWallet = {
  provider: <provider object>,
  address: <account address string>,
  name: <wallet name>,
  id: <wallet id>
}
```

### Events

- `truthsignal:wallet-connected` - Dispatched when wallet connects successfully
  - Event detail contains the full `window.truthsignalWallet` object

### Stub Function

```javascript
window.truthsignalWalletSign = async function(payload) {
  return { ok: false, reason: 'not implemented' };
}
```

## Testing Instructions

1. **Start server and UI:**
   ```bash
   cd server && npm start
   cd ui && python3 -m http.server 8080
   ```

2. **Open browser:**
   - Navigate to `http://localhost:8080`
   - Open browser console (F12)

3. **Test detection:**
   - Click "Upload & Sign" button
   - Check console for: `detectWallets result`
   - Verify wallet list shows detected wallets (Slush first if present)

4. **Test connection:**
   - Click "Connect" button next to a wallet
   - Approve connection in wallet extension
   - Check console for: `connect result`
   - Verify `window.truthsignalWallet` is set
   - Verify connection status shows in UI

5. **Verify helper:**
   - In console, type: `window.truthsignalWallet`
   - Should show: `{ provider, address, name, id }`

6. **Verify event:**
   - Check console for: `truthsignal:wallet-connected event:`

## Expected Console Output

```
detectWallets result [{id: "slush", name: "Slush", ...}, ...]
screenshot-for-debug /mnt/data/Screenshot 2025-11-24 at 3.52.00 AM.png
connect result {ok: true, address: "0x...", method: "connect() + getAccounts()", ...}
truthsignal:wallet-connected event: {provider: {...}, address: "0x...", name: "Slush", id: "slush"}
```

## Error Handling

- **User rejection:** Returns `{ok: false, reason: 'user_rejected'}`
- **No accounts:** Returns `{ok: false, reason: 'no_accounts_found'}`
- **Connection failed:** Returns `{ok: false, reason: 'connection_failed'}`

All errors are displayed in the UI with user-friendly messages.

## Next Steps

- Implement `window.truthsignalWalletSign()` for actual signing
- Integrate signing into Walrus upload flow
- Add transaction signing support

