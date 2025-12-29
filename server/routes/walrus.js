/**
 * Walrus server route - minimal implementation
 * Endpoints:
 *  POST /walrus/prepare-and-initiate  { snapshotId, includeAudio }
 *  POST /walrus/create-publish-payload { pkgId }
 *  POST /walrus/submit-signed { pkgId, signature, signerAddress }
 *  POST /walrus/save-cid { pkgId, cid }  (manual)
 *
 * This file uses simple file storage in server/data/walrus_packages/
 */
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { buildRegistryTx, hasOnchainConfig, getOnchainConfig } from '../../lib/onchain/tx-builder.js';

// Import fetch for Node.js (if not available globally)
let fetch;
if (typeof globalThis.fetch === 'undefined') {
  fetch = (await import('node-fetch')).default;
} else {
  fetch = globalThis.fetch;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const DATA_DIR = path.join(__dirname,'..','data','walrus_packages');
fs.mkdirSync(DATA_DIR, { recursive: true });

function makePkgPath(id){ return path.join(DATA_DIR, id + '.json'); }
function ts(){ return new Date().toISOString(); }

router.post('/prepare-and-initiate', express.json(), (req, res) => {
  try{
    const { snapshotId, includeAudio } = req.body;
    if(!snapshotId) return res.status(400).json({error:'snapshotId required'});
    const pkgId = 'pkg-' + crypto.randomBytes(6).toString('hex');
    const pkg = {
      pkgId,
      snapshotId,
      includeAudio: !!includeAudio,
      createdAt: ts(),
      status: 'prepared'
    };
    fs.writeFileSync(makePkgPath(pkgId), JSON.stringify(pkg,null,2));
    return res.json({ ok:true, pkgId, filename: pkgId + '.zip' });
  }catch(e){
    console.error(e);
    return res.status(500).json({ ok:false, error: String(e) });
  }
});

router.post('/create-publish-payload', express.json(), (req, res) => {
  try{
    const { pkgId } = req.body;
    if(!pkgId) return res.status(400).json({error:'pkgId required'});
    const p = JSON.parse(fs.readFileSync(makePkgPath(pkgId)));
    
    // Get snapshot data to create proper payload
    const snapshotDir = path.join(__dirname, '..', 'data', 'snapshots');
    const snapshotFiles = fs.readdirSync(snapshotDir).filter(f => f.endsWith('.json'));
    let snapshotData = null;
    
    // Find snapshot by digest or snapshotId
    for (const f of snapshotFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(snapshotDir, f), 'utf8'));
      if (data.digest === p.snapshotId || data.cid === p.snapshotId) {
        snapshotData = data;
        break;
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
    
    // store payload
    p.walrusPayload = walrusPayload;
    p.contentString = contentString;
    fs.writeFileSync(makePkgPath(pkgId), JSON.stringify(p,null,2));
    
    // Return message for signing (like PlantBuddy)
    return res.json({ ok:true, pkgId, walrusPayload, type: 'message' });
  }catch(e){
    console.error(e);
    return res.status(500).json({ ok:false, error: String(e) });
  }
});

router.post('/submit-signed', express.json({limit:'2mb'}), async (req, res) => {
  try{
    const { pkgId, signature, signerAddress } = req.body;
    if(!pkgId || !signature) return res.status(400).json({error:'pkgId and signature required'});
    const pkgPath = makePkgPath(pkgId);
    if(!fs.existsSync(pkgPath)) return res.status(404).json({error:'pkg not found'});
    const pkg = JSON.parse(fs.readFileSync(pkgPath));
    
    // Get snapshot data
    const snapshotDir = path.join(__dirname, '..', 'data', 'snapshots');
    const snapshotFiles = fs.readdirSync(snapshotDir).filter(f => f.endsWith('.json'));
    let snapshotData = null;
    
    // Find snapshot by digest or snapshotId
    for (const f of snapshotFiles) {
      const data = JSON.parse(fs.readFileSync(path.join(snapshotDir, f), 'utf8'));
      if (data.digest === pkg.snapshotId || data.cid === pkg.snapshotId) {
        snapshotData = data;
        break;
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
      pkg.snapshotDigest = pkg.snapshotDigest || pkg.walrusPayload?.metadata?.digest;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg,null,2));
      
      // Save mapping
      const mapPath = path.join(DATA_DIR,'walrus_cids.json');
      let map = {};
      if(fs.existsSync(mapPath)) map = JSON.parse(fs.readFileSync(mapPath));
      map[cid] = { pkgId, snapshotId: pkg.snapshotId, signerAddress, ts: ts(), walrusUrl: storageUrl };
      fs.writeFileSync(mapPath, JSON.stringify(map,null,2));
      
      // Log
      const logPath = path.join(__dirname,'..','logs','walrus_upload.log');
      try{ 
        fs.mkdirSync(path.dirname(logPath),{recursive:true}); 
        fs.appendFileSync(logPath, `[${ts()}] uploaded ${pkgId} -> ${cid} (${storageUrl})\n`);
      }catch(e){}
      
      return res.json({ 
        ok:true, 
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
      const cid = 'dev-' + crypto.createHash('sha256').update(digest + signature).digest('hex').slice(0,20);
      pkg.status = 'upload_failed';
      pkg.cid = cid;
      pkg.error = uploadError.message;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg,null,2));
      return res.status(500).json({ 
        ok:false, 
        error: `Walrus upload failed: ${uploadError.message}`,
        fallbackCid: cid
      });
    }
  }catch(e){
    console.error(e);
    return res.status(500).json({ ok:false, error: String(e) });
  }
});

router.post('/save-cid', express.json(), (req,res)=>{
  try{
    const { pkgId, cid, walrusCid, snapshotId, suiTxDigest } = req.body;
    const resolvedCid = cid || walrusCid;
    if(!resolvedCid) return res.status(400).json({error:'cid required'});

    let snapshotRef = snapshotId || null;

    if (pkgId) {
      const pkgPath = makePkgPath(pkgId);
      if(!fs.existsSync(pkgPath)) return res.status(404).json({error:'pkg not found'});
      const pkg = JSON.parse(fs.readFileSync(pkgPath));
      pkg.cid = resolvedCid;
      pkg.status = 'uploaded';
      pkg.uploadedAt = ts();
      if (suiTxDigest) {
        pkg.suiTxDigest = suiTxDigest;
      }
      fs.writeFileSync(pkgPath, JSON.stringify(pkg,null,2));
      snapshotRef = pkg.snapshotId || snapshotRef;
    }

    const mapPath = path.join(DATA_DIR,'walrus_cids.json');
    let map = {};
    if(fs.existsSync(mapPath)) map = JSON.parse(fs.readFileSync(mapPath));
    map[resolvedCid] = { 
      pkgId: pkgId || null, 
      snapshotId: snapshotRef || null, 
      ts: ts(),
      suiTxDigest: suiTxDigest || null
    };
    fs.writeFileSync(mapPath, JSON.stringify(map,null,2));
    return res.json({ ok:true, cid: resolvedCid });
  }catch(e){ console.error(e); return res.status(500).json({ok:false,error:String(e)}); }
});

router.get('/cid/:cid', (req,res)=>{
  try{
    const mapPath = path.join(DATA_DIR,'walrus_cids.json');
    if(!fs.existsSync(mapPath)) return res.status(404).json({error:'no mapping'});
    const map = JSON.parse(fs.readFileSync(mapPath));
    const entry = map[req.params.cid];
    if(!entry) return res.status(404).json({error:'cid not found'});
    res.json({ ok:true, entry });
  }catch(e){ console.error(e); res.status(500).json({ok:false,error:String(e)}); }
});

router.post('/create-registry-tx', express.json(), async (req, res) => {
  try {
    if (!hasOnchainConfig()) {
      return res.status(503).json({ ok: false, error: 'On-chain registry config is missing on the server' });
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
    console.error('create-registry-tx error:', err);
    return res.status(500).json({ ok: false, error: err.message || 'failed to build registry tx' });
  }
});

export default router;
