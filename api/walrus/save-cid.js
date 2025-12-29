import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'walrus_packages');
fs.mkdirSync(DATA_DIR, { recursive: true });

function makePkgPath(id) {
  return path.join(DATA_DIR, id + '.json');
}

function ts() {
  return new Date().toISOString();
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
    const { pkgId, cid, walrusCid, snapshotId, suiTxDigest } = req.body;
    const resolvedCid = cid || walrusCid;
    if (!resolvedCid) {
      return res.status(400).json({ ok: false, error: 'cid required' });
    }

    let snapshotRef = snapshotId || null;

    if (pkgId) {
      const pkgPath = makePkgPath(pkgId);
      if (!fs.existsSync(pkgPath)) {
        return res.status(404).json({ ok: false, error: 'pkg not found' });
      }
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      pkg.cid = resolvedCid;
      pkg.status = 'uploaded';
      pkg.uploadedAt = ts();
      if (suiTxDigest) {
        pkg.suiTxDigest = suiTxDigest;
      }
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      snapshotRef = pkg.snapshotId || snapshotRef;
    }

    const mapPath = path.join(DATA_DIR, 'walrus_cids.json');
    let map = {};
    if (fs.existsSync(mapPath)) {
      map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    }
    map[resolvedCid] = {
      pkgId: pkgId || null,
      snapshotId: snapshotRef || null,
      ts: ts(),
      suiTxDigest: suiTxDigest || null
    };
    fs.writeFileSync(mapPath, JSON.stringify(map, null, 2));

    return res.json({ ok: true, cid: resolvedCid });
  } catch (err) {
    console.error('api/walrus/save-cid error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'failed to save cid' });
  }
}
