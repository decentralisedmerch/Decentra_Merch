# TruthSignal Server

Express backend for TruthSignal Trust Oracle MVP.

## Features

- Snapshot creation and verification
- MQTT device notifications
- Walrus package preparation and upload (with wallet signing support)

## Setup

```bash
npm install
npm start
```

Server runs on port 4000 (configurable via `PORT` env var).

## API Endpoints

### Snapshot
- `POST /snapshot` - Create a new snapshot
- `GET /latest` - Get latest snapshot
- `POST /verify` - Verify a snapshot

### Walrus Integration

#### Upload & Sign Flow (Recommended)

1. **`POST /walrus/prepare-and-initiate`** - Prepare package and create upload record
   - Input: `{ snapshotId, includeAudio: boolean }`
   - Response: `{ ok: true, pkgId, filename, size, prepareAt }`
   - Creates zip package with manifest.json and snapshot.json
   - Stores package record in `server/data/walrus_packages/packages.json`

2. **`POST /walrus/create-publish-payload`** - Create publish payload for wallet signing
   - Input: `{ pkgId, publisherAddress?: string }`
   - Response: `{ ok: true, pkgId, walrusPayload }`
   - Computes file metadata (size, digest, mime type)
   - Builds Walrus publish request payload
   - Stores payload for verification

3. **`POST /walrus/submit-signed`** - Submit signed payload to Walrus API
   - Input: `{ pkgId, signedWalrusPayload, signerAddress?, signature? }`
   - Response: `{ ok: true, cid: <walrusCid>, walrusUrl: <portal link> }`
   - Forwards signed payload to Walrus API with retry logic (3x with exponential backoff)
   - Saves Walrus CID mapping automatically
   - Updates package status to 'uploaded'

#### Manual Upload Flow (Fallback)

- `POST /walrus/prepare` - Prepare a Walrus package zip (legacy endpoint)
- `GET /walrus/download/:zipname` - Download prepared zip file
- `POST /walrus/save-cid` - Save Walrus CID for a snapshot (manual entry)
- `GET /walrus/cid/:cid` - Get Walrus CID for a snapshot
- `POST /walrus/finalize` - Attach returned CID to the snapshot

#### Utility Endpoints

- `GET /walrus/upload/:pkgId` - Get package info for upload
- `POST /walrus/publish` - Auto-publish to Walrus (requires env vars, deprecated)

## Environment Variables

### Optional Walrus Configuration

```bash
# Walrus API endpoint (default: https://portal.wal.app/api/v1)
export WALRUS_API_URL="https://portal.wal.app/api/v1"

# Walrus Publisher URL (default: same as WALRUS_API_URL)
export WALRUS_PUBLISHER_URL="https://portal.wal.app/api/v1"

# Optional API key for authenticated requests
export WALRUS_API_KEY="your-api-key-here"
```

### Server Configuration

```bash
# Server port (default: 4000)
export PORT=4000

# Enable debug logging
export DEBUG=1

# Price fetching configuration
export PRICE_PROXY_URL="https://api.coingecko.com/api/v3/simple/price"  # Default Coingecko API
export WAL_PRICE_URL="http://localhost:4000/price/wal"  # Fallback for WAL if not on Coingecko
```

## Data Storage

All Walrus-related data is stored in `server/data/walrus_packages/`:

- **`packages.json`** - Package records with status tracking
  ```json
  {
    "<pkgId>": {
      "pkgId": "...",
      "snapshotId": "...",
      "filename": "walrus_<snapshotId>_<timestamp>.zip",
      "size": 1234,
      "createdAt": "2025-11-24T...",
      "status": "prepared|uploaded|failed"
    }
  }
  ```

- **`walrus_cids.json`** - Walrus CID mappings
  ```json
  {
    "<snapshotId>": {
      "walrusCid": "...",
      "snapshotId": "...",
      "pkgId": "...",
      "publisherAddress": "0x...",
      "uploadedAt": "2025-11-24T..."
    }
  }
  ```

- **`walrus_payloads.json`** - Stored publish payloads for verification

- **`*.zip`** - Prepared package files (temporary storage)

## Logging

All Walrus operations are logged to `server/logs/walrus_upload.log`:

- Package preparation
- Payload creation
- Wallet signature received
- Walrus upload attempts (with retries)
- Success/failure status

Log format: `[timestamp] [LEVEL] message | {json data}`

## Upload & Sign Flow (Frontend)

1. User clicks "Upload & Sign" button
2. Frontend calls `POST /walrus/prepare-and-initiate`
3. Frontend calls `POST /walrus/create-publish-payload`
4. Frontend detects Sui wallet provider (window.sui, window.suiet, window.ethos, etc.)
5. Frontend requests wallet signature using appropriate method:
   - `signAndExecuteTransactionBlock` (preferred)
   - `signTransaction` (fallback)
   - `signMessage` (fallback)
   - `signData` (fallback)
6. Frontend submits signed payload via `POST /walrus/submit-signed`
7. Server forwards to Walrus API with retry logic
8. Server returns Walrus CID and portal URL
9. Frontend displays success with CID link and "Save to Snapshot" button

## Manual Upload Flow (Fallback)

1. User clicks "Manual Upload" button
2. Frontend calls `POST /walrus/prepare` (legacy endpoint)
3. Zip file downloads automatically
4. User manually uploads to Walrus portal (https://portal.wal.app)
5. User copies Walrus CID from portal
6. User pastes CID in UI and clicks "Save Walrus CID"
7. Frontend calls `POST /walrus/save-cid` to store mapping

## Security

- **Input Validation**: All snapshotId and pkgId inputs are validated to prevent path traversal
- **Payload Verification**: Signed payloads are verified against stored payloads (digest check)
- **No Private Keys**: Wallet private keys never leave the browser
- **CORS**: All endpoints support CORS for frontend access

## Error Handling

- **Retry Logic**: Walrus API calls use exponential backoff (3 retries: 1s, 2s, 4s)
- **Status Tracking**: Package records track status: `prepared`, `uploaded`, `failed`
- **Detailed Logging**: All errors are logged with context for debugging

## Package Manifest Format

The prepared Walrus package includes:

- **`manifest.json`**:
```json
{
  "name": "truthsignal-snapshot-<snapshotId>",
  "description": "TruthSignal snapshot for <token> at <timestamp>",
  "token": "<token>",
  "snapshotId": "<snapshotId>",
  "timestamp": "<timestamp>",
  "version": "0.1.0",
  "cid": "<snapshotId>",
  "created_by": "TruthSignal"
}
```

- **`snapshot.json`**: Full snapshot data with digest

## Testing

Run unit tests:
```bash
node server/routes/walrus.test.js
```

Manual test commands:
```bash
# 1. Create snapshot
curl -X POST http://localhost:4000/snapshot \
  -H "Content-Type: application/json" \
  -d '{"token":"sui","price":1.23,"timestamp":"2025-11-24T03:00:00Z"}'

# 2. Prepare package
curl -X POST http://localhost:4000/walrus/prepare-and-initiate \
  -H "Content-Type: application/json" \
  -d '{"snapshotId":"dev-9d4ff20cc91c","includeAudio":false}'

# 3. Create publish payload
curl -X POST http://localhost:4000/walrus/create-publish-payload \
  -H "Content-Type: application/json" \
  -d '{"pkgId":"<pkgId>"}'

# 4. Check package status
cat server/data/walrus_packages/packages.json | jq

# 5. Check logs
tail -f server/logs/walrus_upload.log
```

## References

- Walrus Web API: https://docs.wal.app/usage/web-api.html
- Walrus MCP Library: https://github.com/Mr-Sunglasses/walrus-mcp
- Sui Wallet Documentation: https://docs.sui.io/build/wallet-kit

## Notes

- **Walrus API Details**: The implementation uses the documented Walrus Web API format. If the actual API requires different fields or authentication, update the `submit-signed` endpoint accordingly.
- **Wallet Compatibility**: The frontend supports multiple Sui wallet providers. If a specific wallet requires different signing methods, update the `getSuiProvider()` and signing logic in `ui/index.html`.
- **File Storage**: Package files are stored temporarily. Consider implementing cleanup for old packages if storage becomes an issue.
