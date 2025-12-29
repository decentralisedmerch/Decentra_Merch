/*
  walrus-adapter.js

  Client helper to orchestrate prepare -> create-publish-payload -> sign -> submit-signed

  Uses the server endpoints created in server/routes/walrus.js

  Exposes window.truthsignalWalrusUpload(snapshotId, includeAudio)

*/

// Use relative path for Vercel compatibility, but allow local dev override
const BASE = window.location.hostname === 'localhost' ? "http://localhost:4000" : "";

async function api(path, body){
  // Use /api/walrus for Vercel, /walrus for local dev
  const apiPath = BASE ? `${BASE}/walrus/${path}` : `/api/walrus/${path}`;
  const res = await fetch(apiPath, { 
    method:'POST', 
    headers:{'Content-Type':'application/json'}, 
    body: JSON.stringify(body) 
  });

  return res.ok ? await res.json() : { ok:false, status:res.status, text: await res.text() };
}



async function prepare(snapshotId, includeAudio=false){

  return api('prepare-and-initiate', { snapshotId, includeAudio });

}



async function createPublishPayload(pkgId){

  return api('create-publish-payload', { pkgId });

}



async function submitSigned(pkgId, signature, signerAddress){

  return api('submit-signed', { pkgId, signature, signerAddress });

}

async function createRegistryTx(pkgId) {
  return api('create-registry-tx', { pkgId });
}

export async function truthsignalWalrusUpload(snapshotId, includeAudio=false){

  if(!snapshotId) return { ok:false, error:'snapshotId required' };

  // 1 prepare

  const p = await prepare(snapshotId, includeAudio);

  if(!p.ok && !p.pkgId) return { ok:false, step:'prepare', resp:p };

  const pkgId = p.pkgId;

  // 2 create payload

  const payloadResp = await createPublishPayload(pkgId);

  if(!payloadResp.ok) return { ok:false, step:'createPayload', resp: payloadResp };

  const walrusPayload = payloadResp.walrusPayload;

  // 3 sign in wallet

  if(!window.truthsignalWallet) return { ok:false, error:'connect wallet first' };

  // sign message

  const msg = JSON.stringify(walrusPayload.message || walrusPayload);

  const signRes = await window.truthsignalSignMessage(msg);

  if(!signRes.ok) return { ok:false, step:'sign', resp:signRes };

  // 4 submit signed

  const final = await submitSigned(pkgId, signRes.signature, window.truthsignalWallet.address);

  return final;

}

export async function buildRegistryTransaction(pkgId) {
  if (!pkgId) return { ok: false, error: 'pkgId required' };
  return createRegistryTx(pkgId);
}

// attach to window for simple use

window.truthsignalWalrusUpload = truthsignalWalrusUpload;
window.truthsignalBuildRegistryTx = buildRegistryTransaction;

console.log('walrus-adapter loaded');

