import crypto from 'crypto';
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
    const { snapshotId, includeAudio } = req.body;
    if (!snapshotId) {
      return res.status(400).json({ error: 'snapshotId required' });
    }
    
    const pkgId = 'pkg-' + crypto.randomBytes(6).toString('hex');
    const pkg = {
      pkgId,
      snapshotId,
      includeAudio: !!includeAudio,
      createdAt: ts(),
      status: 'prepared'
    };
    
    fs.writeFileSync(makePkgPath(pkgId), JSON.stringify(pkg, null, 2));
    return res.json({ ok: true, pkgId, filename: pkgId + '.zip' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

