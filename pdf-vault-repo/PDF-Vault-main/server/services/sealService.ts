import crypto from 'crypto';

/**
 * Seal Service - Handles CV encryption/decryption with access control
 * 
 * MOCK IMPLEMENTATION:
 * This is a mock implementation using Node.js crypto for AES-256-GCM encryption.
 * In production, replace with the actual Seal SDK for Sui-based access control.
 * 
 * Real Seal Integration (when SDK is available):
 * - Use Seal SDK to create policy objects on Sui
 * - Implement on-chain access control rules
 * - Generate decryption keys based on wallet signatures
 * - Integrate with Sui wallet for identity verification
 * 
 * Documentation: https://docs.seal.io (when available)
 */

interface EncryptCVParams {
  pdfBytes: Buffer;
  ownerAddress: string;
  policy?: {
    accessMode: 'owner_only' | 'specific_wallets' | 'secret_code';
    allowedViewers?: string[];
    secretAccessCode?: string;
  };
}

interface EncryptCVResult {
  ciphertext: Buffer;
  sealObjectId: string;
  encryptionKey: string; // MOCK ONLY: Returned for storage persistence (real Seal manages on-chain)
}

interface GetDecryptionKeyParams {
  sealObjectId: string;
  viewerAddress?: string;
  secretAccessCode?: string;
}

interface GetDecryptionKeyResult {
  decryptKey: string;
  approved: boolean;
}

interface DecryptCVParams {
  ciphertext: Buffer;
  decryptKey: string;
}

/**
 * Mock Seal Service
 * 
 * In production, this would interact with Seal smart contracts on Sui
 * to manage encryption keys and access policies.
 */
class SealService {
  private ALGORITHM = 'aes-256-gcm';
  private IV_LENGTH = 16;
  private AUTH_TAG_LENGTH = 16;
  
  // Mock storage for Seal objects (in production, this would be on-chain)
  private sealObjects = new Map<string, {
    ownerAddress: string;
    encryptionKey: string;
    policy: any;
    createdAt: Date;
  }>();

  /**
   * Encrypt a CV PDF using Seal
   * 
   * MOCK: Uses AES-256-GCM encryption with a random key
   * REAL: Would call Seal SDK to:
   * 1. Create a Seal policy object on Sui
   * 2. Encrypt the PDF using Seal's encryption scheme
   * 3. Store the encryption metadata on-chain
   * 
   * Example real implementation:
   * ```
   * const sealClient = new SealClient(suiProvider);
   * const result = await sealClient.encryptData({
   *   data: pdfBytes,
   *   owner: ownerAddress,
   *   policy: {
   *     type: 'approval-based',
   *     approvers: [ownerAddress],
   *   }
   * });
   * ```
   */
  async encryptCV(params: EncryptCVParams): Promise<EncryptCVResult> {
    const { pdfBytes, ownerAddress, policy } = params;

    // Generate a random encryption key (32 bytes for AES-256)
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    
    // Generate random IV
    const iv = crypto.randomBytes(this.IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(
      this.ALGORITHM,
      Buffer.from(encryptionKey, 'hex'),
      iv
    );
    
    // Encrypt the PDF
    const encrypted = Buffer.concat([
      cipher.update(pdfBytes),
      cipher.final()
    ]);
    
    // Get authentication tag
    const authTag = (cipher as any).getAuthTag();
    
    // Combine IV + encrypted data + auth tag
    const ciphertext = Buffer.concat([iv, encrypted, authTag]);
    
    // Generate a mock Seal object ID (in production, this would be a Sui object ID)
    const sealObjectId = `seal_${crypto.randomBytes(16).toString('hex')}`;
    
    // Store the Seal object metadata (in production, this would be on-chain)
    this.sealObjects.set(sealObjectId, {
      ownerAddress,
      encryptionKey,
      policy: policy || { accessMode: 'owner_only', allowedViewers: [], secretAccessCode: undefined },
      createdAt: new Date()
    });

    console.log(`[Seal Mock] Created Seal object ${sealObjectId} for owner ${ownerAddress}`);
    console.log(`[Seal Mock] Encrypted ${pdfBytes.length} bytes → ${ciphertext.length} bytes`);

    return {
      ciphertext,
      sealObjectId,
      encryptionKey // MOCK ONLY: Return for storage persistence (real Seal doesn't expose keys)
    };
  }

  /**
   * Get decryption key for a viewer
   * 
   * MOCK: Always approves and returns the stored encryption key
   * REAL: Would call Seal SDK to:
   * 1. Verify viewer's wallet signature
   * 2. Check access policy on-chain
   * 3. Generate/return a decryption key only if policy allows
   * 
   * Example real implementation:
   * ```
   * const sealClient = new SealClient(suiProvider);
   * const result = await sealClient.requestAccess({
   *   sealObjectId,
   *   requester: viewerAddress,
   *   signature: await wallet.signMessage('Request CV access')
   * });
   * ```
   */
  async getDecryptionKey(params: GetDecryptionKeyParams): Promise<GetDecryptionKeyResult> {
    const { sealObjectId, viewerAddress, secretAccessCode } = params;

    console.log(`[Seal Mock] Access request for ${sealObjectId}`);
    if (viewerAddress) console.log(`  - Via wallet: ${viewerAddress}`);
    if (secretAccessCode) console.log(`  - Via secret code: ${secretAccessCode.substring(0, 8)}...`);

    const sealObject = this.sealObjects.get(sealObjectId);
    
    if (!sealObject) {
      throw new Error(`Seal object not found: ${sealObjectId}`);
    }

    // MOCK: Check access based on policy mode
    // REAL: Check on-chain policy and require wallet signature
    const { policy, ownerAddress } = sealObject;
    const accessMode = policy.accessMode || 'owner_only';
    
    console.log(`[Seal Mock] Access mode: ${accessMode}`);
    
    // Method 1: Secret code access (only if mode is secret_code)
    if (accessMode === 'secret_code') {
      if (!secretAccessCode) {
        throw new Error(`Access denied. This CV requires a secret access code.`);
      }
      
      if (secretAccessCode === policy.secretAccessCode) {
        console.log(`[Seal Mock] ✓ Access granted via secret code`);
        return {
          decryptKey: sealObject.encryptionKey,
          approved: true
        };
      } else {
        console.log(`[Seal Mock] ✗ Invalid secret code`);
        throw new Error(`Access denied. Invalid secret access code.`);
      }
    }
    
    // Method 2: Wallet-based access control
    if (!viewerAddress) {
      throw new Error(`Access denied. Please provide a wallet address.`);
    }
    
    const isOwner = viewerAddress.toLowerCase() === ownerAddress.toLowerCase();
    
    // Owner-only mode: only owner can access
    if (accessMode === 'owner_only') {
      if (!isOwner) {
        console.log(`[Seal Mock] ✗ Access denied for ${viewerAddress} (owner-only mode)`);
        throw new Error(`Access denied. Only the CV owner can decrypt this CV.`);
      }
      
      console.log(`[Seal Mock] ✓ Access granted for owner ${viewerAddress}`);
      return {
        decryptKey: sealObject.encryptionKey,
        approved: true
      };
    }
    
    // Specific wallets mode: ONLY allowed viewers (owner must be explicitly added)
    if (accessMode === 'specific_wallets') {
      const isAllowedViewer = policy.allowedViewers?.some(
        (addr: string) => addr.toLowerCase() === viewerAddress.toLowerCase()
      ) || false;
      
      if (!isAllowedViewer) {
        console.log(`[Seal Mock] ✗ Access denied for ${viewerAddress} (not in allowed list)`);
        throw new Error(`Access denied. Wallet ${viewerAddress} is not authorized to decrypt this CV.`);
      }
      
      console.log(`[Seal Mock] ✓ Access granted for ${viewerAddress} (allowed viewer)`);
      return {
        decryptKey: sealObject.encryptionKey,
        approved: true
      };
    }

    // Fallback error
    throw new Error(`Access denied. Invalid access mode or authentication method.`);
  }

  /**
   * Decrypt CV using decryption key
   * 
   * MOCK: Uses AES-256-GCM decryption
   * REAL: Would use Seal's decryption scheme
   * 
   * Example real implementation:
   * ```
   * const sealClient = new SealClient(suiProvider);
   * const pdfBytes = await sealClient.decrypt({
   *   ciphertext,
   *   decryptionKey: result.key
   * });
   * ```
   */
  async decryptCV(params: DecryptCVParams): Promise<Buffer> {
    const { ciphertext, decryptKey } = params;

    // Extract IV, encrypted data, and auth tag
    const iv = ciphertext.subarray(0, this.IV_LENGTH);
    const authTag = ciphertext.subarray(ciphertext.length - this.AUTH_TAG_LENGTH);
    const encrypted = ciphertext.subarray(this.IV_LENGTH, ciphertext.length - this.AUTH_TAG_LENGTH);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(
      this.ALGORITHM,
      Buffer.from(decryptKey, 'hex'),
      iv
    );
    
    (decipher as any).setAuthTag(authTag);
    
    // Decrypt
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    console.log(`[Seal Mock] Decrypted ${ciphertext.length} bytes → ${decrypted.length} bytes`);

    return decrypted;
  }

  /**
   * Verify ciphertext hash
   * Useful for proving the CV hasn't been tampered with
   */
  computeCiphertextHash(ciphertext: Buffer): string {
    return crypto.createHash('sha256').update(ciphertext).digest('hex');
  }
}

// Export singleton instance
export const sealService = new SealService();
