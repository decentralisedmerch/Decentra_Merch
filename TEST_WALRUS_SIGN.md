# Testing Walrus Upload & Sign Flow

This document describes how to manually test the Upload & Sign flow with Sui wallets.

## Prerequisites

1. **Server running**: `cd server && npm start` (should be on port 4000)
2. **UI running**: `cd ui && python3 -m http.server 8080` (or use existing UI host)
3. **Sui wallet extension installed**: Slush, Suiet, Nightly, or Sui Wallet

## Test Steps

### 1. Setup

1. Open browser and navigate to `http://localhost:8080`
2. Install a Sui wallet extension (recommended: Slush for testing)
3. Open browser DevTools (F12) and go to Console tab
4. Verify wallet is detected in console (should see wallet injection messages)

### 2. Create Snapshot

1. Select token from dropdown (BTC, SUI, or WAL)
2. Verify price is auto-fetched and displayed next to token name
3. Click "Take Snapshot"
4. Verify snapshot appears in "Latest Snapshot" section
5. Verify "Upload & Sign" button appears

### 3. Test Wallet Detection

1. Click "Upload & Sign" button
2. Modal should open showing "Upload & Sign" and "Manual Upload" options
3. Click "Upload & Sign"
4. **Expected**: Wallet list should appear showing detected wallets
   - If Slush installed: Should see "Slush" in list
   - If multiple wallets: All should be listed with radio buttons
   - If no wallets: Should show "No wallet detected — use Manual Upload"

### 4. Test Upload & Sign Flow

1. Select a wallet from the list (e.g., "Slush")
2. Check "Include audio" if needed (optional)
3. Click "Start Upload & Sign"
4. **Expected progress states**:
   - ⏳ Preparing package...
   - ⏳ Payload ready...
   - ⏳ Waiting for wallet...
5. **Wallet popup should appear** - approve the connection request
6. **Wallet signing popup should appear** - approve the signature
7. **Expected progress states**:
   - ⏳ Uploading...
   - ✅ Confirmed!
8. **Expected result**:
   - Success message displayed
   - Walrus CID shown with clickable link
   - "Copy" button to copy CID
   - "Save to Snapshot" button
   - "Retry" button

### 5. Test Error Handling

#### Test: Wallet Rejection
1. Start upload flow
2. When wallet popup appears, click "Reject" or "Cancel"
3. **Expected**: Error message "Transaction signing was cancelled by user"
4. **Expected**: "Retry Sign" and "Download Zip & Manual Upload" buttons appear

#### Test: Network Error
1. Stop the server
2. Start upload flow
3. **Expected**: Error message about connection failure
4. **Expected**: Retry button appears

### 6. Test Price Fetching

1. Check bottom-right corner for fetch frequency toggle (30s / 5m)
2. Select "30s" - prices should update every 30 seconds
3. Select "5m" - prices should update every 5 minutes
4. Verify prices appear next to token names in dropdown
5. Verify current price updates when token is selected

### 7. Test Manual Upload Fallback

1. Click "Upload & Sign" button
2. Click "Manual Upload" (or if no wallet detected, this is the only option)
3. Check "Include audio" if needed
4. Click "Prepare & Download Package"
5. **Expected**: Zip file downloads automatically
6. Follow instructions to upload to Walrus portal manually
7. Paste Walrus CID in the input field
8. Click "Save Walrus CID"
9. **Expected**: CID appears on snapshot card with portal link

## Expected Server Logs

Check `server/logs/walrus_upload.log` for:

```
[timestamp] [INFO] Package preparation initiated { snapshotId: '...', includeAudio: false }
[timestamp] [INFO] Package prepared successfully { pkgId: '...', snapshotId: '...', size: ... }
[timestamp] [INFO] Creating publish payload { pkgId: '...' }
[timestamp] [INFO] Created publish payload { pkgId: '...', size: ..., digest: '...' }
[timestamp] [INFO] Submitting signed payload { pkgId: '...', signerAddress: '0x...' }
[timestamp] [INFO] Successfully submitted to Walrus { pkgId: '...', walrusCid: '...' }
```

## Wallet-Specific Notes

### Slush Wallet
- Should be detected as `window.slush`
- Supports `signMessage` and `signAndExecuteTransactionBlock`
- Test with both payload types (tx and message)

### Suiet Wallet
- Should be detected as `window.suiet`
- Standard Sui wallet interface

### Nightly Wallet
- Should be detected as `window.nightly`
- May have different API - check console for compatibility messages

### Sui Wallet (Official)
- Should be detected as `window.sui`
- Standard interface

## Troubleshooting

### Wallet Not Detected
- Check browser console for wallet injection messages
- Verify wallet extension is enabled
- Try refreshing the page
- Check if wallet is in the supported list (see `detectWallets()` function)

### Signing Fails
- Check browser console for error messages
- Verify wallet is connected and unlocked
- Check if wallet supports the required signing method
- Try a different wallet if available

### Upload Fails
- Check server logs: `tail -f server/logs/walrus_upload.log`
- Verify server is running and accessible
- Check network tab in DevTools for API errors
- Verify Walrus API endpoint is correct (check env vars)

### Price Not Updating
- Check network tab for `/price/:symbol` requests
- Verify server endpoint is working: `curl http://localhost:4000/price/btc`
- Check fetch frequency toggle is set correctly
- Verify Coingecko API is accessible (or WAL_PRICE_URL is configured)

## Success Criteria

✅ Wallet detection works for installed wallets
✅ Wallet selection UI appears and works
✅ Upload & Sign flow completes successfully
✅ Progress states display correctly
✅ Walrus CID is returned and displayed
✅ CID can be saved to snapshot
✅ Price fetching works with frequency toggle
✅ Error handling shows appropriate messages and retry options
✅ Manual upload fallback works when no wallet detected

## Browser Console Commands for Testing

```javascript
// Check detected wallets
detectWallets()

// Manually trigger price update
updatePrices()

// Check current selected wallet
selectedWallet

// Force wallet detection
checkSuiWallet()
```

