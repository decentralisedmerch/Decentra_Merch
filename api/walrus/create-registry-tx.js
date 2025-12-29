import fs from 'fs';
import path from 'path';
import { buildRegistryTx, hasOnchainConfig, getOnchainConfig } from '../../lib/onchain/tx-builder.js';

const DATA_DIR = path.join(process.cwd(), 'data', 'walrus_packages');
fs.mkdirSync(DATA_DIR, { recursive: true });

function makePkgPath(id) {
  return path.join(DATA_DIR, id + '.json');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    if (!hasOnchainConfig()) {
      return res.status(503).json({ ok: false, error: 'On-chain registry config missing' });
    }

    const { pkgId } = req.body;
    if (!pkgId) {
      return res.status(400).json({ ok: false, error: 'pkgId required' });
    }

    const pkgPath = makePkgPath(pkgId);
    if (!fs.existsSync(pkgPath)) {
      return res.status(404).json({ ok: false, error: 'Package not found' });
    }

    const pkg = JSON.parse(fs.readFileSync(pkgPath));
    if (!pkg.cid) {
      return res.status(400).json({ ok: false, error: 'Walrus upload not completed for this package' });
    }

    const txResult = await buildRegistryTx({
      cid: pkg.cid,
      snapshotId: pkg.snapshotId,
      walrusUrl: pkg.walrusUrl || pkg.portalUrl || '',
      digest: pkg.walrusPayload?.metadata?.digest || pkg.walrusDigest || '',
      sizeBytes: pkg.packageSize || 0,
      includeAudio: pkg.includeAudio || false,
    });

    return res.json({
      ok: true,
      pkgId,
      txBytes: txResult.txBytes,
      onchain: getOnchainConfig(),
    });
  } catch (err) {
    console.error('api/walrus/create-registry-tx error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'failed to build registry tx' });
  }
}
