import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { createHash, randomBytes } from "crypto";
import { storage } from "./storage";
import { uploadCVToWalrus, retrieveFromWalrus } from "./services/walrusService";
import { registerCVProofOnSui } from "./services/suiService";
import { sealService } from "./services/sealService";
import { generateChallenge, verifySignature } from "./auth";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

// Validation schema for registration
const registerSchema = z.object({
  walletAddress: z.string().min(10, "Wallet address must be at least 10 characters"),
  accessMode: z.enum(["owner_only", "specific_wallets", "secret_code"]).optional(),
  allowedViewers: z.array(z.string()).optional(), // For "specific_wallets" mode
  secretAccessCode: z.string().optional(), // For "secret_code" mode (will auto-generate if not provided)
});

export async function registerRoutes(app: Express): Promise<Server> {
  /**
   * POST /api/proof/register
   * 
   * Registers a new CV proof with Seal encryption
   * - Accepts PDF file upload and wallet address
   * - Encrypts PDF using Seal (mock)
   * - Uploads encrypted CV to Walrus (mocked)
   * - Registers proof on Sui blockchain (mocked)
   * - Stores proof record in storage
   */
  app.post("/api/proof/register", upload.single("cvFile"), async (req, res) => {
    try {
      // Validate file upload
      if (!req.file) {
        return res.status(400).json({ message: "CV file is required" });
      }

      // Parse allowedViewers from JSON string if needed
      let parsedBody = { ...req.body };
      if (req.body.allowedViewers && typeof req.body.allowedViewers === 'string') {
        try {
          parsedBody.allowedViewers = JSON.parse(req.body.allowedViewers);
        } catch (e) {
          return res.status(400).json({
            message: "Invalid allowedViewers format. Must be a JSON array of wallet addresses.",
          });
        }
      }

      // Validate request body
      const validation = registerSchema.safeParse(parsedBody);
      if (!validation.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: validation.error.errors,
        });
      }

      const { walletAddress, accessMode, allowedViewers, secretAccessCode } = validation.data;
      const fileBuffer = req.file.buffer;
      const fileName = req.file.originalname;

      console.log(`\n=== Starting CV Registration with Seal Encryption ===`);
      console.log(`File: ${fileName} (${fileBuffer.length} bytes)`);
      console.log(`Wallet: ${walletAddress}`);
      console.log(`Access Mode: ${accessMode || 'owner_only'}`);

      // Step 1: Compute original file hash (SHA-256)
      const fileHash = createHash("sha256").update(fileBuffer).digest("hex");
      console.log(`✅ Original File Hash: ${fileHash}`);

      // Step 2: Encrypt CV using Seal with access control policy
      // Generate secret code if accessMode is "secret_code"
      const generatedSecretCode = (accessMode === "secret_code" && !secretAccessCode)
        ? randomBytes(8).toString('hex')
        : secretAccessCode;

      if (generatedSecretCode) {
        console.log(`✅ Generated Secret Access Code: ${generatedSecretCode}`);
      }

      const finalAccessMode = accessMode || "owner_only";

      const { ciphertext, sealObjectId, encryptionKey } = await sealService.encryptCV({
        pdfBytes: fileBuffer,
        ownerAddress: walletAddress,
        policy: {
          accessMode: finalAccessMode,
          allowedViewers: finalAccessMode === "specific_wallets" ? (allowedViewers || []) : [],
          secretAccessCode: generatedSecretCode
        }
      });
      console.log(`✅ Encrypted with Seal. Object ID: ${sealObjectId}`);

      // Step 3: Compute ciphertext hash
      const ciphertextHash = sealService.computeCiphertextHash(ciphertext);
      console.log(`✅ Ciphertext Hash: ${ciphertextHash}`);

      // Step 4: Upload encrypted CV to Walrus (mocked)
      const { contentId, storageUrl } = await uploadCVToWalrus(ciphertext, `encrypted-${fileName}`);
      console.log(`✅ Uploaded to Walrus. Content ID: ${contentId}`);

      // Step 5: Register on Sui blockchain (mocked)
      const { txHash, proofCode } = await registerCVProofOnSui({
        fileHash,
        contentId,
        walletAddress,
        sealObjectId,
        ciphertextHash,
      });
      console.log(`✅ Registered on Sui. TX: ${txHash}`);

      // Step 6: Store proof record in storage
      const proof = await storage.createCVProof({
        walletAddress,
        fileHash,
        sealObjectId,
        ciphertextHash,
        encryptionKey, // MOCK ONLY: Store for persistence across server restarts
        accessMode: finalAccessMode,
        contentId,
        storageUrl,
        txHash,
        proofCode,
        secretAccessCode: generatedSecretCode || null,
        allowedViewers: (finalAccessMode === "specific_wallets" ? allowedViewers : null) || null,
      });

      console.log(`✅ Proof Code: ${proofCode}`);
      console.log(`=== Registration Complete ===\n`);

      res.status(201).json(proof);
    } catch (error) {
      console.error("❌ Error registering CV proof:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to register CV proof",
      });
    }
  });

  /**
   * POST /api/proof/update-tx
   * 
   * Updates proof record with real blockchain transaction hash
   */
  app.post("/api/proof/update-tx", async (req, res) => {
    try {
      const { proofCode, txHash } = req.body;

      if (!proofCode || !txHash) {
        return res.status(400).json({ message: "Proof code and transaction hash required" });
      }

      console.log(`\n=== Updating Transaction Hash ===`);
      console.log(`Proof Code: ${proofCode}`);
      console.log(`Real Tx Hash: ${txHash}`);

      // Update with real transaction hash
      const updatedProof = await storage.updateCVProofTxHash(proofCode, txHash);

      if (!updatedProof) {
        return res.status(404).json({ message: "Failed to update proof" });
      }

      console.log(`✅ Updated proof code: ${proofCode} → ${txHash}`);
      console.log(`=== Transaction Updated ===\n`);

      res.json(updatedProof);
    } catch (error) {
      console.error("Error updating transaction:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to update transaction",
      });
    }
  });

  /**
   * GET /api/proof/:proofCode
   * 
   * Retrieves a CV proof by proof code
   * - Returns proof details if found
   * - Returns 404 if not found
   */
  app.get("/api/proof/:proofCode", async (req, res) => {
    try {
      const { proofCode } = req.params;

      console.log(`\n=== Retrieving Proof ===`);
      console.log(`Proof Code: ${proofCode}`);

      const proof = await storage.getCVProofByCode(proofCode);

      if (!proof) {
        console.log(`Proof not found`);
        console.log(`=== Retrieval Failed ===\n`);
        return res.status(404).json({ message: "Proof not found" });
      }

      console.log(`Proof found for wallet: ${proof.walletAddress}`);
      console.log(`=== Retrieval Complete ===\n`);

      res.json(proof);
    } catch (error) {
      console.error("Error retrieving CV proof:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to retrieve CV proof",
      });
    }
  });

  /**
   * GET /api/proof/:proofCode/decrypted
   * 
   * Decrypts and serves the CV PDF for a recruiter
   * - Retrieves proof metadata
   * - Fetches encrypted CV from Walrus
   * - Requests decryption key from Seal (with access control check)
   * - Decrypts the CV
   * - Serves as PDF
   */
  app.get("/api/proof/:proofCode/decrypted", async (req, res) => {
    try {
      const { proofCode } = req.params;
      const { viewerAddress, secretAccessCode } = req.query;

      console.log(`\n=== Decrypting CV ===`);
      console.log(`Proof Code: ${proofCode}`);
      if (viewerAddress) console.log(`Viewer Wallet: ${viewerAddress}`);
      if (secretAccessCode) console.log(`Secret Code: ${(secretAccessCode as string).substring(0, 8)}...`);

      // Step 1: Get proof record
      const proof = await storage.getCVProofByCode(proofCode);
      
      if (!proof) {
        console.log(`❌ Proof not found`);
        return res.status(404).json({ message: "Proof not found" });
      }

      console.log(`✅ Proof found for wallet: ${proof.walletAddress}`);
      console.log(`Seal Object ID: ${proof.sealObjectId}`);

      // Step 2: Fetch encrypted CV from Walrus
      const encryptedBuffer = await retrieveFromWalrus(proof.contentId);
      
      if (!encryptedBuffer) {
        console.log(`❌ Encrypted CV not found in Walrus`);
        return res.status(404).json({ message: "Encrypted CV not found" });
      }

      console.log(`✅ Retrieved encrypted CV (${encryptedBuffer.length} bytes)`);

      // Step 3: Check access control (using stored policy data)
      const accessMode = proof.accessMode || 'owner_only';
      console.log(`[Access Control] Mode: ${accessMode}`);

      // Method 1: Secret code access (only if mode is secret_code)
      if (accessMode === 'secret_code') {
        if (!secretAccessCode) {
          console.log(`[Access Control] ✗ Secret code required but not provided`);
          throw new Error(`Access denied. This CV requires a secret access code.`);
        }
        
        if (secretAccessCode !== proof.secretAccessCode) {
          console.log(`[Access Control] ✗ Invalid secret code`);
          throw new Error(`Access denied. Invalid secret access code.`);
        }
        
        console.log(`[Access Control] ✓ Access granted via secret code`);
      }
      // Method 2: Wallet-based access control
      else {
        if (!viewerAddress || typeof viewerAddress !== 'string') {
          console.log(`[Access Control] ✗ Wallet address required`);
          throw new Error(`Access denied. Please provide a wallet address.`);
        }

        const isOwner = viewerAddress.toLowerCase() === proof.walletAddress.toLowerCase();
        
        // Owner-only mode: only owner can access
        if (accessMode === 'owner_only') {
          if (!isOwner) {
            console.log(`[Access Control] ✗ Access denied (owner-only mode)`);
            throw new Error(`Access denied. Only the CV owner can decrypt this CV.`);
          }
          console.log(`[Access Control] ✓ Access granted for owner`);
        }
        // Specific wallets mode: ONLY allowed viewers (owner must be explicitly added)
        else if (accessMode === 'specific_wallets') {
          const isAllowedViewer = proof.allowedViewers?.some(
            (addr) => addr.toLowerCase() === viewerAddress.toLowerCase()
          ) || false;
          
          if (!isAllowedViewer) {
            console.log(`[Access Control] ✗ Wallet not in allowed list`);
            throw new Error(`Access denied. Wallet ${viewerAddress} is not authorized to decrypt this CV.`);
          }
          console.log(`[Access Control] ✓ Access granted (allowed viewer)`);
        }
      }

      // Step 4: Verify ciphertext integrity
      const computedHash = sealService.computeCiphertextHash(encryptedBuffer);
      if (computedHash !== proof.ciphertextHash) {
        console.log(`❌ Ciphertext hash mismatch!`);
        console.log(`Expected: ${proof.ciphertextHash}`);
        console.log(`Got: ${computedHash}`);
        return res.status(400).json({ 
          message: "CV integrity check failed. File may have been tampered with." 
        });
      }

      console.log(`✅ Ciphertext integrity verified`);

      // Step 5: Decrypt the CV using stored encryption key
      const decryptedPDF = await sealService.decryptCV({
        ciphertext: encryptedBuffer,
        decryptKey: proof.encryptionKey, // Use stored key (MOCK ONLY)
      });

      console.log(`✅ Decrypted successfully (${decryptedPDF.length} bytes)`);
      console.log(`=== Decryption Complete ===\n`);

      // Step 6: Serve the PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="cv-${proofCode.substring(0, 8)}.pdf"`);
      res.send(decryptedPDF);

    } catch (error) {
      console.error("❌ Error decrypting CV:", error);
      
      // Handle different error types appropriately
      if (error instanceof Error) {
        if (error.message.includes("Access denied")) {
          return res.status(403).json({ message: error.message });
        }
        if (error.message.includes("not found")) {
          return res.status(404).json({ message: error.message });
        }
      }
      
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to decrypt CV",
      });
    }
  });

  /**
   * GET /api/cv/:contentId
   * 
   * [DEPRECATED] Downloads CV file from Walrus storage
   * This endpoint is kept for backward compatibility but serves encrypted data
   * Use /api/proof/:proofCode/decrypted instead for proper decryption
   */
  app.get("/api/cv/:contentId", async (req, res) => {
    try {
      const { contentId } = req.params;

      console.log(`\n=== [DEPRECATED] Downloading from Walrus ===`);
      console.log(`Content ID: ${contentId}`);
      console.log(`⚠️  Warning: This endpoint serves encrypted data. Use /api/proof/:proofCode/decrypted instead.`);

      const fileBuffer = await retrieveFromWalrus(contentId);

      if (!fileBuffer) {
        console.log(`File not found in Walrus`);
        return res.status(404).json({ message: "File not found" });
      }

      console.log(`✅ Retrieved ${fileBuffer.length} bytes from Walrus`);
      console.log(`=== Download Complete ===\n`);

      // Set proper headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="encrypted-${contentId.substring(0, 8)}.pdf"`);
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to download file",
      });
    }
  });

  /**
   * GET /api/proofs/wallet/:walletAddress
   * 
   * Retrieves all CV proofs for a specific wallet address
   * - Returns array of proofs
   * - Returns empty array if none found
   */
  app.get("/api/proofs/wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;

      console.log(`\n=== Retrieving Proofs by Wallet ===`);
      console.log(`Wallet: ${walletAddress}`);

      const proofs = await storage.getCVProofsByWallet(walletAddress);

      console.log(`Found ${proofs.length} proof(s)`);
      console.log(`=== Retrieval Complete ===\n`);

      res.json(proofs);
    } catch (error) {
      console.error("Error retrieving CV proofs:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to retrieve CV proofs",
      });
    }
  });

  /**
   * POST /api/auth/challenge
   * 
   * Generate an authentication challenge nonce for wallet signature
   * - Client requests a nonce for their wallet address
   * - Server generates and stores the nonce with timestamp
   * - Client signs the nonce with their wallet
   * - Nonce expires after 5 minutes
   */
  app.post("/api/auth/challenge", async (req, res) => {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress || typeof walletAddress !== 'string') {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      const nonce = generateChallenge(walletAddress);

      res.json({ nonce });
    } catch (error) {
      console.error("Error generating challenge:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to generate challenge",
      });
    }
  });

  /**
   * POST /api/proof/:proofCode/decrypt-owner
   * 
   * Decrypt and serve CV PDF for authenticated owner
   * - Verifies wallet signature against challenge nonce
   * - Confirms the wallet owns the CV proof
   * - Decrypts and serves the PDF
   * 
   * Security: Wallet ownership is verified via signature, preventing spoofing
   */
  app.post("/api/proof/:proofCode/decrypt-owner", async (req, res) => {
    try {
      const { proofCode } = req.params;
      const { walletAddress, nonce, signature } = req.body;

      console.log(`\n=== Authenticated Owner Decrypt ===`);
      console.log(`Proof Code: ${proofCode}`);
      console.log(`Wallet: ${walletAddress}`);

      // Validate request body
      if (!walletAddress || !nonce || !signature) {
        return res.status(400).json({ 
          message: "Missing required fields: walletAddress, nonce, signature" 
        });
      }

      // Step 1: Verify wallet signature
      const isValid = await verifySignature(nonce, walletAddress, signature);
      
      if (!isValid) {
        console.log(`❌ Signature verification failed`);
        return res.status(401).json({ 
          message: "Invalid signature or expired challenge" 
        });
      }

      console.log(`✅ Signature verified for wallet: ${walletAddress}`);

      // Step 2: Get proof record
      const proof = await storage.getCVProofByCode(proofCode);
      
      if (!proof) {
        console.log(`❌ Proof not found`);
        return res.status(404).json({ message: "Proof not found" });
      }

      // Step 3: Verify wallet owns this CV
      if (proof.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        console.log(`❌ Wallet does not own this CV`);
        console.log(`Expected: ${proof.walletAddress}`);
        console.log(`Got: ${walletAddress}`);
        return res.status(403).json({ 
          message: "You do not own this CV proof" 
        });
      }

      console.log(`✅ Wallet verified as CV owner`);

      // Step 4: Fetch encrypted CV from Walrus
      const encryptedBuffer = await retrieveFromWalrus(proof.contentId);
      
      if (!encryptedBuffer) {
        console.log(`❌ Encrypted CV not found in Walrus`);
        return res.status(404).json({ message: "Encrypted CV not found" });
      }

      console.log(`✅ Retrieved encrypted CV (${encryptedBuffer.length} bytes)`);

      // Step 5: Verify ciphertext integrity
      const computedHash = sealService.computeCiphertextHash(encryptedBuffer);
      if (computedHash !== proof.ciphertextHash) {
        console.log(`❌ Ciphertext hash mismatch!`);
        return res.status(400).json({ 
          message: "CV integrity check failed" 
        });
      }

      console.log(`✅ Ciphertext integrity verified`);

      // Step 6: Decrypt the CV using stored encryption key
      const decryptedPDF = await sealService.decryptCV({
        ciphertext: encryptedBuffer,
        decryptKey: proof.encryptionKey, // Use stored key (MOCK ONLY)
      });

      console.log(`✅ Decrypted successfully (${decryptedPDF.length} bytes)`);
      console.log(`=== Authenticated Decrypt Complete ===\n`);

      // Step 8: Serve the PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="cv-${proofCode.substring(0, 8)}.pdf"`);
      res.send(decryptedPDF);
    } catch (error) {
      console.error("Error decrypting CV for owner:", error);
      res.status(500).json({
        message: error instanceof Error ? error.message : "Failed to decrypt CV",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
