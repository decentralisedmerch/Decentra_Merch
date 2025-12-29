import express from 'express';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import mqtt from 'mqtt';
import cors from 'cors';
import walrusRouter from './routes/walrus.js';
import createDeviceRouter from './routes/device.js';

const app = express();
app.use(cors({ origin: 'http://localhost:8080', methods: ['GET', 'POST'], credentials: true }));  // allow UI origin
app.options('*', cors());     // preflight support
app.use(express.json({ limit: '5mb' }));

const PORT = process.env.PORT || 4000;
const SNAP_DIR = path.resolve('./data/snapshots');
await fs.mkdir(SNAP_DIR, { recursive: true });

const MQTT_URL = process.env.MQTT_URL || 'mqtt://127.0.0.1:1883';
const DEVICE_TOPIC = 'truthsignal/device/ATOM-1/notify';
const mqttClient = mqtt.connect(MQTT_URL);

mqttClient.on('connect', () => console.log('MQTT connected:', MQTT_URL));
mqttClient.on('error', (e) => console.error('MQTT error', e));

function sha256(x) { return crypto.createHash('sha256').update(x).digest('hex'); }

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount Walrus routes
app.use('/walrus', walrusRouter);

// Mount Device routes (for sequence buttons)
const deviceRouter = createDeviceRouter(mqttClient, 'http://192.168.0.5:4000');
app.use('/device', deviceRouter);

// Serve audio files from ui/audio
app.use('/audio', express.static(path.join(process.cwd(), 'ui', 'audio')));

// Serve static assets (images, etc.)
app.use('/assets', express.static(path.join(process.cwd(), 'ui', 'assets')));

// Serve static HTML files from ui directory
app.use(express.static(path.join(process.cwd(), 'ui')));

// Serve landing page as default route (now index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'ui', 'index.html'));
});

// Price fetching endpoint with caching
const priceCache = new Map();
const PRICE_CACHE_TTL = 10000; // 10 seconds

app.get('/price/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toLowerCase();
    const cacheKey = symbol;
    const now = Date.now();

    // Check cache
    if (priceCache.has(cacheKey)) {
      const cached = priceCache.get(cacheKey);
      if (now - cached.timestamp < PRICE_CACHE_TTL) {
        return res.json({ symbol, price: cached.price, cached: true, timestamp: cached.timestamp });
      }
    }

    // Fetch from upstream
    const PRICE_PROXY_URL = process.env.PRICE_PROXY_URL || 'https://api.coingecko.com/api/v3/simple/price';
    
    let price = null;
    
    // Map symbols to Coingecko IDs
    const coinMap = {
      'btc': 'bitcoin',
      'sui': 'sui',
      'wal': 'wal' // May not be on Coingecko
    };

    const coinId = coinMap[symbol];
    
    if (coinId && symbol !== 'wal') {
      // Try Coingecko first
      try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${PRICE_PROXY_URL}?ids=${coinId}&vs_currencies=usd`);
        if (response.ok) {
          const data = await response.json();
          if (data[coinId] && data[coinId].usd) {
            price = data[coinId].usd;
          }
        }
      } catch (err) {
        console.error('Coingecko fetch error:', err.message);
      }
    }

    // Fallback for WAL or if Coingecko fails
    if (!price && symbol === 'wal') {
      // Use custom upstream endpoint if configured (not self-recursive)
      const WAL_PRICE_URL = process.env.WAL_PRICE_URL;
      if (WAL_PRICE_URL && !WAL_PRICE_URL.includes('localhost:4000')) {
        try {
          const fetch = (await import('node-fetch')).default;
          const response = await fetch(WAL_PRICE_URL);
          if (response.ok) {
            const data = await response.json();
            price = data.price || data.usd || null;
          }
        } catch (err) {
          console.error('WAL price fetch error:', err.message);
        }
      }
      // If no custom URL or Coingecko doesn't have WAL, return null (will show 404)
    }

    if (price === null) {
      return res.status(404).json({ error: `Price not found for ${symbol}` });
    }

    // Cache the result
    priceCache.set(cacheKey, { price, timestamp: now });

    res.json({ symbol, price, cached: false, timestamp: now });
  } catch (err) {
    console.error('Price fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch price', details: err.message });
  }
});

app.post('/snapshot', async (req, res) => {
  try {
    const { token, price, timestamp } = req.body;
    if (!token || typeof price !== 'number' || !timestamp) {
      return res.status(400).json({ error: 'token, price (number), timestamp required' });
    }

    const payload = { token, price, timestamp };
    const digest = sha256(JSON.stringify(payload));
    const fname = path.join(SNAP_DIR, `${digest}.json`);
    await fs.writeFile(fname, JSON.stringify({ ...payload, digest }, null, 2));

    const cid = "dev-" + digest.slice(0, 12);
    const sealProof = { cid, signature: "devsig", signerPubKey: "devkey" };

    res.json({ status: "accepted", cid, digest, sealProof, verified: false });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.post('/verify', async (req, res) => {
  try {
    const { cid, sealProof } = req.body;
    if (!cid || !sealProof) return res.status(400).json({ error: "cid + sealProof required" });

    const valid = sealProof.signature === "devsig";

    res.json({ cid, valid });

    if (valid) {
      const msg = { cid, verified: true, ts: new Date().toISOString() };
      mqttClient.publish(DEVICE_TOPIC, JSON.stringify(msg));
      console.log("MQTT sent:", msg);
    }

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.get('/latest', async (req, res) => {
  try {
    const files = (await fs.readdir(SNAP_DIR)).filter(f => f.endsWith('.json'));
    if (!files.length) return res.json(null);

    let latest = null;
    for (const f of files) {
      const data = JSON.parse(await fs.readFile(path.join(SNAP_DIR, f), "utf8"));
      if (!latest || new Date(data.timestamp) > new Date(latest.timestamp)) latest = data;
    }

    res.json(latest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.listen(PORT, () => {
  console.log("TruthSignal backend running on port", PORT);
  console.log('HTTP server listening on', PORT);
});

