import { TransactionBlock } from '@mysten/sui/transactions';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import onchainConfig from '../../config/onchain.json' assert { type: 'json' };

const NETWORK = onchainConfig.network || 'testnet';
const FULLNODE_URL = onchainConfig.fullnodeUrl || getFullnodeUrl(NETWORK);

const client = new SuiClient({ url: FULLNODE_URL });
const REQUIRED_FIELDS = ['packageId', 'registryId', 'registryInitialVersion'];

export function hasOnchainConfig() {
  return REQUIRED_FIELDS.every((key) => typeof onchainConfig[key] === 'string' && onchainConfig[key].length > 0);
}

export function getOnchainConfig() {
  return {
    ...onchainConfig,
    network: NETWORK,
    fullnodeUrl: FULLNODE_URL,
  };
}

export async function buildRegistryTx({ cid, snapshotId, walrusUrl = '', digest = '', sizeBytes = 0, includeAudio = false }) {
  if (!hasOnchainConfig()) {
    throw new Error('On-chain registry config missing. Provide packageId, registryId, registryInitialVersion.');
  }

  if (!cid || !snapshotId) {
    throw new Error('cid and snapshotId are required to build registry transaction');
  }

  const tx = new TransactionBlock();
  tx.moveCall({
    target: `${onchainConfig.packageId}::walrus_registry::register_entry`,
    arguments: [
      tx.sharedObjectRef({
        objectId: onchainConfig.registryId,
        initialSharedVersion: onchainConfig.registryInitialVersion,
        mutable: true,
      }),
      tx.pure.string(cid),
      tx.pure.string(snapshotId),
      tx.pure.string(walrusUrl),
      tx.pure.string(digest),
      tx.pure.u64(Number(sizeBytes) || 0),
      tx.pure.bool(!!includeAudio),
    ],
  });

  const txBytes = await tx.build({ client });

  return {
    txBytes: Buffer.from(txBytes).toString('base64'),
    summary: {
      packageId: onchainConfig.packageId,
      registryId: onchainConfig.registryId,
      registryInitialVersion: onchainConfig.registryInitialVersion,
      network: NETWORK,
      fullnodeUrl: FULLNODE_URL,
    },
  };
}
