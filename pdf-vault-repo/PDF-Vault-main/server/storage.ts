import { type User, type InsertUser, type CVProof, type InsertCVProof, users, cvProofs } from "@shared/schema";
import { randomUUID } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // User methods (legacy - can be removed if not needed)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // CV Proof methods
  createCVProof(proof: InsertCVProof): Promise<CVProof>;
  updateCVProofTxHash(proofCode: string, txHash: string): Promise<CVProof | undefined>;
  getCVProofByCode(proofCode: string): Promise<CVProof | undefined>;
  getCVProofsByWallet(walletAddress: string): Promise<CVProof[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private cvProofs: Map<string, CVProof>;

  constructor() {
    this.users = new Map();
    this.cvProofs = new Map();
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // CV Proof methods
  async createCVProof(insertProof: InsertCVProof): Promise<CVProof> {
    const id = randomUUID();
    const proof: CVProof = {
      ...insertProof,
      id,
      secretAccessCode: insertProof.secretAccessCode ?? null,
      allowedViewers: insertProof.allowedViewers ?? null,
      createdAt: new Date(),
    };
    this.cvProofs.set(proof.proofCode, proof);
    return proof;
  }

  async getCVProofByCode(proofCode: string): Promise<CVProof | undefined> {
    return this.cvProofs.get(proofCode);
  }

  async getCVProofsByWallet(walletAddress: string): Promise<CVProof[]> {
    return Array.from(this.cvProofs.values()).filter(
      (proof) => proof.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
  }

  async updateCVProofTxHash(proofCode: string, txHash: string): Promise<CVProof | undefined> {
    const proof = this.cvProofs.get(proofCode);
    if (!proof) return undefined;

    const updatedProof = { ...proof, txHash, proofCode: txHash };
    this.cvProofs.delete(proofCode);
    this.cvProofs.set(txHash, updatedProof);
    return updatedProof;
  }
}

export class DbStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required for DbStorage");
    }
    const connection = neon(process.env.DATABASE_URL);
    this.db = drizzle(connection);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // CV Proof methods
  async createCVProof(insertProof: InsertCVProof): Promise<CVProof> {
    const result = await this.db.insert(cvProofs).values(insertProof).returning();
    return result[0];
  }

  async getCVProofByCode(proofCode: string): Promise<CVProof | undefined> {
    const result = await this.db.select().from(cvProofs).where(eq(cvProofs.proofCode, proofCode));
    return result[0];
  }

  async getCVProofsByWallet(walletAddress: string): Promise<CVProof[]> {
    const result = await this.db.select().from(cvProofs).where(
      sql`lower(${cvProofs.walletAddress}) = lower(${walletAddress})`
    );
    return result;
  }

  async updateCVProofTxHash(proofCode: string, txHash: string): Promise<CVProof | undefined> {
    const result = await this.db
      .update(cvProofs)
      .set({ txHash, proofCode: txHash })
      .where(eq(cvProofs.proofCode, proofCode))
      .returning();
    return result[0];
  }
}

// Use DbStorage for production, MemStorage for development/testing
export const storage = process.env.DATABASE_URL ? new DbStorage() : new MemStorage();
