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
    const { pkgId } = req.body;
    if (!pkgId) {
      return res.status(400).json({ error: 'pkgId required' });
    }
    
    const pkgPath = makePkgPath(pkgId);
    if (!fs.existsSync(pkgPath)) {
      return res.status(404).json({ error: 'pkg not found' });
    }
    
    const p = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    // Get snapshot data to create proper payload
    const snapshotDir = path.join(process.cwd(), 'data', 'snapshots');
    let snapshotData = null;
    
    if (fs.existsSync(snapshotDir)) {
      const snapshotFiles = fs.readdirSync(snapshotDir).filter(f => f.endsWith('.json'));
      
      // Find snapshot by digest or snapshotId
      for (const f of snapshotFiles) {
        const data = JSON.parse(fs.readFileSync(path.join(snapshotDir, f), 'utf8'));
        if (data.digest === p.snapshotId || data.cid === p.snapshotId) {
          snapshotData = data;
          break;
        }
      }
    }
    
    // Create package content
    const packageContent = {
      snapshotId: p.snapshotId,
      snapshot: snapshotData,
      timestamp: ts(),
      includeAudio: p.includeAudio || false
    };
    
    const contentString = JSON.stringify(packageContent);
    const digest = crypto.createHash('sha256').update(contentString).digest('hex');
    
    const walrusPayload = {
      pkgId,
      metadata: { 
        name: `truthsignal-snapshot-${p.snapshotId}.json`, 
        description: `TruthSignal snapshot ${p.snapshotId}`, 
        digest,
        timestamp: ts()
      },
      message: contentString
    };
    
    // Store payload
    p.walrusPayload = walrusPayload;
    p.contentString = contentString;
    fs.writeFileSync(pkgPath, JSON.stringify(p, null, 2));
    
    // Return message for signing (like PlantBuddy)
    return res.json({ ok: true, pkgId, walrusPayload, type: 'message' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

