# Wallet Connect Implementation - Slush & Suiet Only

## Summary

Simplified wallet detection and connection to support only Slush (priority 1) and Suiet (priority 2).

## Files Changed

1. **`ui/js/wallet.js`** - Rewritten to support only Slush and Suiet
2. **`ui/index.html`** - Updated to use simplified wallet module, added global connect button
3. **`server/routes/walrus.js`** - Added logging for wallet publish attempts
4. **`tests/wallet-connect.test.js`** - Created test file for wallet detection and connection
5. **`server/package.json`** - Added `test-wallet` script

## Implementation Details

### Wallet Detection
- Only detects `window.slush` and `window.suiet`
- Priority: Slush first, Suiet second
- Returns array of `{id, name, provider}` objects

### Connection Flow

**Slush:**
```javascript
await provider.connect();
const accounts = await provider.getAccounts();
return { ok: true, address: accounts[0].address, provider };
```

**Suiet:**
```javascript
await provider.connect();
const accounts = provider.accounts || [];
return { ok: true, address: accounts[0].address, provider };
```

### Signing Flow
- Uses `signMessage()` for both wallets
- Signs the Walrus payload as a message
- Returns signature to server via `POST /walrus/submit-signed`

### UI Changes
- Wallet list shows only Slush and Suiet
- Connect button for each wallet
- Global "Connect Wallet" button (top-right)
- Connection status display with truncated address
- Error messages for connection failures

### Logging
- Server logs all wallet publish attempts to `server/logs/walrus_upload.log`
- Logs include: timestamp, pkgId, signerAddress, step, result, error (if any)

## Manual Test Steps

1. **Start server:**
   ```bash
   cd server && npm start
   ```

2. **Start UI:**
   ```bash
   cd ui && python3 -m http.server 8080
   ```

3. **Open browser:**
   - Navigate to `http://localhost:8080`
   - Open browser console (F12)

4. **Unlock Slush extension:**
   - Ensure Slush wallet is unlocked

5. **Connect wallet:**
   - Click top-right "Connect Wallet" button OR
   - Open Walrus modal → Select Slush → Click "Connect"
   - Approve connection popup
   - Verify console shows: `truthsignal:wallet-connected` event

6. **Take snapshot:**
   - Select token (BTC/SUI/WAL)
   - Click "Take Snapshot"

7. **Upload & Sign:**
   - Click "Upload & Sign" button
   - Verify wallet is connected (should show address)
   - Click "Start Upload & Sign"
   - Follow progress: Preparing → Payload ready → Waiting for wallet → Signing → Uploading → Done
   - Approve signing popup in wallet
   - Verify success with Walrus CID

8. **Check logs:**
   ```bash
   tail -f server/logs/walrus_upload.log
   ```

## Expected Console Output

```
detectWallets result [{id: "slush", name: "Slush", provider: {...}}]
truthsignal:wallet-connected event: {id: "slush", name: "Slush", address: "0x...", provider: {...}}
```

## Test Command

```bash
cd server && npm run test-wallet
```

## Error Handling

- **Wallet not available:** Shows "Please install Slush" or "Please install Suiet"
- **Connection rejected:** Shows "Connection cancelled by user"
- **No accounts:** Shows "No accounts found. Please connect your wallet in the extension and try again."
- **Signing rejected:** Shows "Signing was cancelled by user. You can retry or use manual upload."
- **Upload failed:** Shows retry button

## Debug Screenshot

Reference: `/mnt/data/Screenshot 2025-11-24 at 12.18.54 AM.png`

