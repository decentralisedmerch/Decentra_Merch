# TruthSignal Lite

Verifiable Market Alert Device - Hardware for the Decentralized Future

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start Vite dev server
npm run dev

# The UI will be available at http://localhost:8080
# API routes will be proxied to http://localhost:4000 (if running)
```

### Local Server (Optional)

If you need to run the Express server locally for MQTT/device communication:

```bash
cd server
npm install
npm start
```

## Deployment to Vercel

### Prerequisites

1. Install Vercel CLI: `npm i -g vercel`
2. Have a Vercel account

### Deploy

```bash
# Login to Vercel
vercel login

# Deploy
vercel

# For production
vercel --prod
```

### Environment Variables

Set these in Vercel dashboard or via CLI:

- `MQTT_URL` - MQTT broker URL (e.g., `mqtt://your-broker.com:1883`)
- `SERVER_BASE_URL` - Base URL for audio files (auto-detected on Vercel)
- `PRICE_PROXY_URL` - Optional: Custom price API URL
- `WAL_PRICE_URL` - Optional: WAL token price URL

### Project Structure

```
.
├── api/              # Vercel serverless functions
│   ├── device/       # Device control endpoints
│   └── health.js     # Health check
├── ui/               # Frontend files
│   ├── index.html    # Main app page
│   ├── landing.html  # Landing page
│   ├── js/           # JavaScript modules
│   └── public/       # Static assets (assets, audio)
├── server/           # Express server (for local dev)
├── firmware/         # M5Stack ATOM Echo firmware
├── vite.config.js    # Vite configuration
├── vercel.json       # Vercel configuration
└── package.json      # Root package.json
```

## Features

- **Landing Page**: Marketing page with product information
- **Main App**: TruthSignal demo with wallet connection and device control
- **Device Control**: MQTT-based sequence triggers for M5Stack ATOM Echo
- **Walrus Integration**: Decentralized storage for snapshots
- **Wallet Support**: Sui wallet connection (Wallet Standard API)

## On-chain Walrus Registry

- The Move package that certifies Walrus uploads lives in `truthsignal_oracle/`.
- It is deployed to Sui **testnet** with package ID  
  `0xe429a53292b70a1a30bc4a6449a432a89da4daad95a959f261cc236067252d77`.
- The shared registry object (`TruthSignalRegistry`) has ID  
  `0xc46184e29012b22553801aaa410acffa9ecfed2374d3b3d0d515d05292a859ea` (initial shared version `349181008`).
- Wallet used for deployment: `0x4b455000a933718e93d9b0b0e00e56d214c281b5c446224780dba56eacc93e32` (alias `blissful-spinel`).
- Frontend/server read these values from `config/onchain.json`. Update this file if you redeploy or rotate addresses:

```json
{
  "network": "testnet",
  "fullnodeUrl": "https://fullnode.testnet.sui.io:443",
  "packageId": "...",
  "registryId": "...",
  "registryInitialVersion": "...",
  "publisher": "0x...",
  "lastUpdated": "ISO timestamp",
  "notes": "optional context"
}
```

- The Express API and Vercel functions use `@mysten/sui` to build a registry transaction that the connected wallet signs after a Walrus upload. Make sure `config/onchain.json` is kept in sync with the latest deployment.

## Notes

- MQTT connections in serverless functions are limited - consider using an external MQTT service for production
- Static assets (images, audio) are served from `/public` directory
- API routes are automatically converted to Vercel serverless functions

