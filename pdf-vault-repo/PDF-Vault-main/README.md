# 🔐 On-Chain PDF Proof Vault

> **Tamper-proof PDF verification with blockchain-backed proof and end-to-end encryption**

Upload once. Verify forever. Encrypted storage on Walrus, immutable proof on Sui blockchain.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://reactjs.org/)
[![Sui](https://img.shields.io/badge/Sui-Blockchain-4da2ff)](https://sui.io/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**On-Chain PDF Proof Vault** is a decentralized document verification platform that combines blockchain immutability with privacy-first encryption. Register your PDF documents with tamper-proof blockchain proofs while maintaining complete privacy through end-to-end encryption.

### Why PDF Proof Vault?

**Traditional cloud storage:**
- ❌ Documents stored unencrypted
- ❌ No proof of authenticity
- ❌ Centralized control
- ❌ Single point of failure

**PDF Proof Vault:**
- ✅ End-to-end encrypted (Seal)
- ✅ Blockchain-verified authenticity (Sui)
- ✅ Decentralized storage (Walrus)
- ✅ Granular access control

---

## ✨ Key Features

### 🔒 **Privacy-First Encryption**
- PDFs encrypted with **Seal** before upload (AES-256-GCM)
- No one can access your documents without authorization
- Not even platform administrators can see unencrypted content

### 🌐 **Decentralized Storage**
- Encrypted PDFs stored on **Walrus** decentralized network
- No single point of failure
- Global accessibility 24/7

### ⛓️ **Blockchain Verification**
- Immutable proof records on **Sui blockchain**
- SHA-256 hash ensures document integrity
- Tamper-proof timestamp and metadata

### 🎛️ **Flexible Access Control**
Three access modes to fit your needs:

1. **Owner-Only**: Only you can decrypt (via wallet signature)
2. **Specific Wallets**: Whitelist authorized wallet addresses
3. **Secret Code**: Share a 16-character code for access

### 🔗 **Shareable Proofs**
- Unique proof codes for easy verification
- Anyone can verify authenticity
- Controlled decryption based on permissions

---

## 🔄 How It Works

### Registration Flow

```
1. Upload PDF → 2. Select Access Control → 3. Automatic Encryption (Seal)
                                            ↓
                                    4. Walrus Upload (encrypted)
                                            ↓
                                    5. Sui Registration (hash + metadata)
                                            ↓
                                    6. Receive Proof Code
```

### Verification Flow

```
1. Enter Proof Code → 2. Blockchain Verification (Sui)
                                ↓
                        3. Access Control Check
                                ↓
                    4. Authenticate (Wallet/Secret Code)
                                ↓
                        5. Decrypt & View PDF
```

---

## 🏗️ Architecture

### Three-Layer Security Model

```
┌─────────────────────────────────────────────────────────┐
│                    User Interface                        │
│              (React + Shadcn UI + Tailwind)             │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                   Backend API Layer                      │
│            (Express.js + TypeScript + Zod)              │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌─────────────────┼─────────────────┐
        ↓                 ↓                  ↓
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Seal Service │  │Walrus Service│  │ Sui Service  │
│ (Encryption) │  │  (Storage)   │  │ (Blockchain) │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Data Flow

1. **PDF Upload** → Frontend receives file
2. **Encryption** → Seal encrypts with AES-256-GCM
3. **Storage** → Encrypted blob uploaded to Walrus
4. **Registration** → Hash + Seal object ID registered on Sui
5. **Proof Generation** → Unique code created for sharing
6. **Verification** → Anyone can verify, authorized users can decrypt

---

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Wouter** - Client-side routing
- **Shadcn UI** - Enterprise-grade components
- **Tailwind CSS** - Styling
- **TanStack Query** - Server state management
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Express.js** - API server
- **TypeScript** - Type safety
- **Multer** - File upload handling
- **Drizzle ORM** - Database toolkit (configured for PostgreSQL)
- **In-memory storage** - Development mode (easily swappable to DB)

### Blockchain & Storage (Current: Mock Implementation)
- **Seal** - Encryption with access control policies
  - Mock: AES-256-GCM with Node.js crypto
  - Production: Seal SDK (planned)
- **Walrus** - Decentralized storage
  - Mock: In-memory storage with simulated content IDs
  - Production: Walrus testnet/mainnet
- **Sui** - Blockchain proof registration
  - Mock: Generated transaction hashes
  - Production: Sui Move smart contracts

### Development Tools
- **Vite** - Build tool & dev server
- **ESBuild** - Fast TypeScript compilation
- **Replit** - Cloud development environment

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- (Optional) PostgreSQL database for production

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/pdf-proof-vault.git
cd pdf-proof-vault
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database (optional - uses in-memory storage by default)
DATABASE_URL=postgresql://user:password@localhost:5432/pdfvault

# Session
SESSION_SECRET=your-secret-key-here

# Future: Walrus API
WALRUS_API_URL=https://walrus-testnet.example.com

# Future: Sui RPC
SUI_RPC_URL=https://fullnode.testnet.sui.io
```

4. **Run development server**
```bash
npm run dev
```

Application will be available at `http://localhost:5000`

### Database Setup (Optional)

If using PostgreSQL instead of in-memory storage:

```bash
# Push schema to database
npm run db:push

# Generate migrations (if needed)
npm run db:generate

# Run migrations
npm run db:migrate
```

---

## 📖 Usage

### Register a PDF

1. Navigate to `/register`
2. Upload your PDF file (max 10MB)
3. Enter your wallet address
4. Choose access control mode:
   - **Owner Only**: Only you can decrypt
   - **Specific Wallets**: Enter allowed wallet addresses
   - **Secret Code**: System generates a 16-char code
5. Click "Register PDF"
6. Receive your unique proof code

### Verify a PDF

1. Navigate to `/verify` or click a shared proof link
2. Enter the proof code
3. View blockchain verification status
4. Authenticate:
   - **Wallet**: Enter your wallet address (for owner/whitelist)
   - **Secret Code**: Enter the shared code
5. Decrypt and view the PDF

### View Your Proofs

1. Navigate to `/profile`
2. Connect your wallet (mock input in MVP)
3. View all your registered PDFs
4. Click "View PDF (Decrypt)" to access your documents

---

## 🗺️ Roadmap

### Phase 1: MVP ✅ (Completed)
- [x] Mock Seal/Walrus/Sui integration
- [x] PDF upload and registration
- [x] Three access control modes
- [x] Proof verification flow
- [x] Professional UI/UX

### Phase 2: Real Integration (Q2 2024)
- [ ] Integrate Seal SDK for real on-chain encryption policies
- [ ] Deploy to Walrus testnet
- [ ] Deploy Sui Move smart contracts
- [ ] PostgreSQL database migration
- [ ] Real wallet integration (Sui wallet adapter)

### Phase 3: Advanced Features (Q3 2024)
- [ ] Batch upload (multiple PDFs)
- [ ] Time-limited access (expiring links)
- [ ] Audit logs (view history)
- [ ] Email notifications
- [ ] API for programmatic access

### Phase 4: Enterprise (Q4 2024)
- [ ] White-label solutions
- [ ] SSO/SAML integration
- [ ] Team collaboration features
- [ ] Analytics dashboard
- [ ] Custom branding

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Sui Foundation** - Blockchain infrastructure
- **Walrus** - Decentralized storage protocol
- **Seal** - Encryption and access control framework
- **Shadcn UI** - Beautiful component library
- **Replit** - Development platform

---

## 📞 Contact

- **Website**: [Your website]
- **Email**: [Your email]
- **Twitter**: [@yourhandle]
- **Discord**: [Your Discord server]

---

## 🔒 Security

If you discover a security vulnerability, please email security@yourproject.com instead of using the issue tracker.

---

**Built with ❤️ using Sui, Walrus, and Seal**

*Empowering document privacy and authenticity on the blockchain*
