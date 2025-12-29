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
    const { pkgId, signature, signerAddress } = req.body;
    if (!pkgId || !signature) {
      return res.status(400).json({ error: 'pkgId and signature required' });
    }
    
    const pkgPath = makePkgPath(pkgId);
    if (!fs.existsSync(pkgPath)) {
      return res.status(404).json({ error: 'pkg not found' });
    }
    
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    
    // Get snapshot data
    const snapshotDir = path.join(process.cwd(), 'data', 'snapshots');
    let snapshotData = null;
    
    if (fs.existsSync(snapshotDir)) {
      const snapshotFiles = fs.readdirSync(snapshotDir).filter(f => f.endsWith('.json'));
      
      // Find snapshot by digest or snapshotId
      for (const f of snapshotFiles) {
        const data = JSON.parse(fs.readFileSync(path.join(snapshotDir, f), 'utf8'));
        if (data.digest === pkg.snapshotId || data.cid === pkg.snapshotId) {
          snapshotData = data;
          break;
        }
      }
    }
    
    // Create package JSON with snapshot data and signature
    const packageData = {
      snapshotId: pkg.snapshotId,
      snapshot: snapshotData,
      signature: signature,
      signerAddress: signerAddress || null,
      timestamp: ts(),
      metadata: pkg.walrusPayload?.metadata || {}
    };
    
    const packageJson = JSON.stringify(packageData, null, 2);
    const packageBuffer = Buffer.from(packageJson, 'utf8');
    pkg.packageSize = packageBuffer.length;
    pkg.walrusDigest = pkg.walrusPayload?.metadata?.digest || packageData.metadata?.digest;
    
    // Upload to Walrus testnet (like PlantBuddy)
    const WALRUS_PUBLISHER = process.env.WALRUS_PUBLISHER || "https://publisher.walrus-testnet.walrus.space";
    const WALRUS_AGGREGATOR = process.env.WALRUS_AGGREGATOR || "https://aggregator.walrus-testnet.walrus.space";
    
    console.log(`[WALRUS] Uploading package ${pkgId} (${packageBuffer.length} bytes) to Walrus testnet...`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch(`${WALRUS_PUBLISHER}/v1/blobs?deletable=true&epochs=5`, {
        method: "PUT",
        body: packageBuffer,
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Walrus upload failed: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      const blobId = result.newlyCreated?.blobObject?.blobId || result.alreadyCertified?.blobId;
      
      if (!blobId) {
        throw new Error("No blob ID returned from Walrus");
      }
      
      const cid = blobId;
      const storageUrl = `${WALRUS_AGGREGATOR}/v1/blobs/${blobId}`;
      
      console.log(`[WALRUS] ✅ Successfully uploaded to Walrus!`);
      console.log(`[WALRUS] Blob ID: ${blobId}`);
      console.log(`[WALRUS] Storage URL: ${storageUrl}`);
      
      // Update package status
      pkg.status = 'uploaded';
      pkg.cid = cid;
      pkg.signature = signature;
      pkg.signerAddress = signerAddress || null;
      pkg.uploadedAt = ts();
      pkg.walrusUrl = storageUrl;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      
      // Save mapping
      const mapPath = path.join(DATA_DIR, 'walrus_cids.json');
      let map = {};
      if (fs.existsSync(mapPath)) {
        map = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
      }
      map[cid] = { pkgId, snapshotId: pkg.snapshotId, signerAddress, ts: ts(), walrusUrl: storageUrl };
      fs.writeFileSync(mapPath, JSON.stringify(map, null, 2));
      
      return res.json({ 
        ok: true, 
        cid, 
        walrusUrl: storageUrl,
        portalUrl: `https://portal.wal.app/package/${cid}`,
        pkgId,
        snapshotId: pkg.snapshotId,
        digest: pkg.walrusPayload?.metadata?.digest || pkg.walrusDigest || null,
        packageSize: pkg.packageSize || packageBuffer.length,
        includeAudio: pkg.includeAudio || false
      });
    } catch (uploadError) {
      console.error('[WALRUS] Upload error:', uploadError);
      // Fallback to dev CID if upload fails
      const digest = pkg.walrusPayload?.metadata?.digest || crypto.createHash('sha256').update(pkg.snapshotId).digest('hex');
      const cid = 'dev-' + crypto.createHash('sha256').update(digest + signature).digest('hex').slice(0, 20);
      pkg.status = 'upload_failed';
      pkg.cid = cid;
      pkg.error = uploadError.message;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      return res.status(500).json({ 
        ok: false, 
        error: `Walrus upload failed: ${uploadError.message}`,
        fallbackCid: cid
      });
    }
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

