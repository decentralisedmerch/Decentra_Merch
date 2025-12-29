import crypto from "crypto";
import { verifyPersonalMessageSignature } from "@mysten/sui/verify";

/**
 * Challenge store for nonce-based authentication
 * Maps nonce → { walletAddress, timestamp }
 */
interface Challenge {
  walletAddress: string;
  timestamp: number;
}

const challengeStore = new Map<string, Challenge>();

/**
 * Challenge expiration time (5 minutes)
 */
const CHALLENGE_EXPIRY_MS = 5 * 60 * 1000;

/**
 * Generate a cryptographic challenge nonce for wallet authentication
 * 
 * @param walletAddress - Sui wallet address
 * @returns Nonce string to be signed by the wallet
 */
export function generateChallenge(walletAddress: string): string {
  const nonce = crypto.randomBytes(32).toString("hex");
  
  challengeStore.set(nonce, {
    walletAddress,
    timestamp: Date.now(),
  });
  
  console.log(`[Auth] Challenge generated for wallet: ${walletAddress}`);
  cleanupExpiredChallenges();
  
  return nonce;
}

/**
 * Verify a wallet signature against a challenge nonce
 * 
 * Uses @mysten/sui to verify Ed25519 signature from Sui wallet
 * 
 * @param nonce - Challenge nonce
 * @param walletAddress - Claimed wallet address
 * @param signature - Wallet signature of the nonce (base64)
 * @returns True if signature is valid and wallet matches
 */
export async function verifySignature(
  nonce: string,
  walletAddress: string,
  signature: string
): Promise<boolean> {
  console.log(`\n=== Verifying Wallet Signature ===`);
  console.log(`Nonce: ${nonce.substring(0, 16)}...`);
  console.log(`Wallet: ${walletAddress}`);
  console.log(`Signature: ${signature.substring(0, 16)}...`);
  
  const challenge = challengeStore.get(nonce);
  
  if (!challenge) {
    console.log(`❌ Challenge not found or expired`);
    return false;
  }
  
  // Check if challenge has expired
  const age = Date.now() - challenge.timestamp;
  if (age > CHALLENGE_EXPIRY_MS) {
    console.log(`❌ Challenge expired (age: ${Math.floor(age / 1000)}s)`);
    challengeStore.delete(nonce);
    return false;
  }
  
  // Check if wallet address matches
  if (challenge.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    console.log(`❌ Wallet address mismatch`);
    console.log(`Expected: ${challenge.walletAddress}`);
    console.log(`Got: ${walletAddress}`);
    return false;
  }
  
  try {
    // Verify the signature using Sui's verification library
    const message = new TextEncoder().encode(nonce);
    
    const publicKey = await verifyPersonalMessageSignature(
      message,
      signature
    );
    
    // Convert public key to Sui address and compare
    const derivedAddress = publicKey.toSuiAddress();
    
    if (derivedAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      console.log(`❌ Signature valid but wallet address mismatch`);
      console.log(`Derived from signature: ${derivedAddress}`);
      console.log(`Expected: ${walletAddress}`);
      return false;
    }
    
    console.log(`✅ Signature verified - wallet authenticated`);
    console.log(`=== Verification Complete ===\n`);
    
    // Delete used challenge (one-time use)
    challengeStore.delete(nonce);
    
    return true;
  } catch (error) {
    console.log(`❌ Signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

/**
 * Cleanup expired challenges from the store
 * Runs automatically during challenge generation
 */
function cleanupExpiredChallenges(): void {
  const now = Date.now();
  let deletedCount = 0;
  
  const entries = Array.from(challengeStore.entries());
  for (const [nonce, challenge] of entries) {
    if (now - challenge.timestamp > CHALLENGE_EXPIRY_MS) {
      challengeStore.delete(nonce);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`[Auth] Cleaned up ${deletedCount} expired challenge(s)`);
  }
}

/**
 * Get challenge store size (for debugging)
 */
export function getChallengeStoreSize(): number {
  return challengeStore.size;
}
