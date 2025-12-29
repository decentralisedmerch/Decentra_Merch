# Wallet Detection & Connection Fix

## Changes Made

1. **Replaced manual wallet detection with Sui Wallet Standard**
   - Using `@mysten/wallet-standard` package via CDN (esm.sh)
   - Using `getWallets()` from the official standard
   - Filtering for wallets with `sui:signTransactionBlock` feature

2. **Updated connection logic**
   - Using `wallet.features['standard:connect'].connect()`
   - Using `wallet.features['sui:accounts'].getAccounts()`
   - Proper error handling for connection failures

3. **Enhanced UI**
   - Shows wallet icons in the list
   - Displays wallet names from the standard
   - Shows connection status
   - Auto-connects when wallet is selected

4. **Exposed helper**
   - `window.truthsignalWallet.selectedWallet` - The selected wallet object
   - `window.truthsignalWallet.selectedAddress` - The connected account address

## Testing

1. Open browser console
2. Open the modal (click "Upload & Sign")
3. Check console for:
   - "=== Wallet Detection Results ==="
   - Number of wallets detected
   - Wallet details (name, features)
4. Select a wallet
5. Check console for:
   - "=== Wallet Connection Success ==="
   - Wallet name
   - Accounts array
   - Selected address
6. Check `window.truthsignalWallet` in console

## Expected Console Output

```
=== Wallet Detection Results ===
Total wallets detected: 1
Wallet 1: {
  name: "Slush",
  icon: "data:image/...",
  hasSignTransactionBlock: true,
  hasConnect: true,
  hasAccounts: true
}
===============================

=== Wallet Connection Success ===
Wallet: Slush
Accounts: ["0x1234..."]
Selected Address: 0x1234...
window.truthsignalWallet: { selectedWallet: {...}, selectedAddress: "0x1234..." }
================================
```

