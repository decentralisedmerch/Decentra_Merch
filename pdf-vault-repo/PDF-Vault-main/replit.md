# On-Chain PDF Proof Vault

## Overview

On-Chain PDF Proof Vault is a full-stack web application that enables users to register their PDF documents with blockchain-backed proof and end-to-end encryption using Seal. The system encrypts PDF files, stores them in decentralized storage (Walrus), and registers tamper-proof verification records on the Sui blockchain. Viewers can verify PDF authenticity and decrypt files through a secure access-control flow managed by Seal encryption policies.

**Key Features:**
- **Seal Encryption**: PDFs are encrypted before upload using Seal (mocked), ensuring privacy
- **Walrus Storage**: Encrypted PDF files stored in decentralized Walrus network
- **Sui Blockchain**: Immutable proof records with encryption metadata stored on-chain
- **Flexible Access Control**: PDF owners choose who can access their PDFs:
  - **Owner Only**: Only the uploading wallet can decrypt
  - **Specific Wallets**: Owner specifies allowed wallet addresses
  - **Secret Code**: Anyone with a 16-character secret code can decrypt (auto-generated)
- **Shareable Proofs**: Unique proof codes allow anyone to view and verify PDF authenticity

The application is built as a monorepo with a React frontend and Express backend, both written in TypeScript. The current implementation includes mock services for Seal, Walrus, and Sui integration, with the architecture designed to easily swap in real SDK implementations when ready.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript running on Vite as the build tool and development server.

**Routing**: Wouter for client-side routing with the following key routes:
- `/` - Landing page with hero and features
- `/register` - PDF registration form (handles encryption automatically)
- `/verify` - Proof code verification lookup
- **`/p/:proofCode`** - **Updated**: Public proof viewing page with Seal decryption flow
- `/success/:proofCode` - Post-registration success page
- `/profile` - User's registered PDF proofs dashboard

**State Management**: TanStack Query (React Query) for server state management with custom query client configuration. No global client state management library is used.

**UI Component Library**: Shadcn UI (New York variant) built on Radix UI primitives with Tailwind CSS for styling. The design follows a modern, professional aesthetic inspired by Material Design and contemporary SaaS applications.

**Form Handling**: React Hook Form with Zod for schema validation and type-safe form management.

**Design System**: Custom Tailwind configuration with HSL-based color tokens supporting light/dark modes. Typography uses Inter for body text and JetBrains Mono for code/monospace elements. The design emphasizes trust, clarity, and a security-forward visual language appropriate for HR/recruiting contexts.

### Backend Architecture

**Framework**: Express.js with TypeScript, compiled using esbuild for production builds.

**API Structure**: RESTful API with primary endpoint `/api/proof/register` for PDF registration. File uploads handled via Multer middleware with 10MB size limit and PDF-only validation.

**Data Storage**: In-memory storage implementation (`MemStorage`) using Maps for development/demo purposes. The storage interface (`IStorage`) is abstracted to allow easy migration to database-backed storage (e.g., PostgreSQL with Drizzle ORM).

**File Processing**: 
- PDF file validation on upload
- SHA-256 hash computation for file integrity verification
- File buffer handling for storage service integration

**Proof Registration Flow** (Updated with Access Control):
1. Validate uploaded PDF file and wallet address
2. **Parse access control options** from registration form:
   - Access mode (owner_only | specific_wallets | secret_code)
   - Allowed viewers (if specific_wallets mode)
   - Auto-generate 16-character secret code (if secret_code mode)
3. Compute SHA-256 hash of original PDF file
4. **Encrypt PDF using Seal** with access control policy (AES-256-GCM mock)
5. Compute ciphertext hash for integrity verification
6. Upload **encrypted PDF** to Walrus storage (mocked)
7. Register proof on Sui blockchain with Seal object ID and ciphertext hash (mocked)
8. Store proof record with unique proof code and access control metadata
9. Return proof details to client (includes secret code if applicable)

**PDF Viewing/Decryption Flow** (Updated with Flexible Auth):
1. Viewer opens proof link (`/p/:proofCode`)
2. **Viewer chooses authentication method** (Wallet or Secret Code tabs)
   - **Wallet Tab**: Enter wallet address (mock input for MVP)
   - **Secret Code Tab**: Enter secret access code
3. System fetches encrypted PDF from Walrus
4. **System validates access control**:
   - Owner only: Check if viewer is the owner
   - Specific wallets: Check if viewer is in allowedViewers array
   - Secret code: Verify secretAccessCode matches
5. If access granted, Seal returns decryption key
6. System decrypts PDF and serves file to viewer
7. PDF displayed in browser or downloaded

**Service Layer Architecture**: 
- `sealService.ts` - Encryption/decryption and **access control validation** (AES-256-GCM mock)
  - `encryptPDF()` - Encrypts with access control policy
  - `getDecryptionKey()` - **Validates access control** before returning key
  - `decryptPDF()` - Decrypts with validated key
- `walrusService.ts` - Decentralized storage integration (currently mocked)
- `suiService.ts` - Blockchain proof registration (currently mocked)

All services include detailed comments explaining the real implementation approach when SDKs become available.

### Database Schema (Drizzle ORM)

**Primary Table**: `cv_proofs` (Updated with Access Control)
- `id` - UUID primary key
- `walletAddress` - User's wallet identifier (PDF owner)
- `fileHash` - SHA-256 hash of the **original PDF** file
- `sealObjectId` - Seal encryption policy object ID
- `ciphertextHash` - SHA-256 hash of encrypted data (integrity verification)
- **`secretAccessCode`** - **NEW**: 16-char hex secret code (nullable, for secret_code mode)
- **`allowedViewers`** - **NEW**: Array of wallet addresses (nullable, for specific_wallets mode)
- `contentId` - Walrus storage content identifier (stores **encrypted** PDF)
- `storageUrl` - URL to retrieve **encrypted** PDF from Walrus
- `txHash` - Sui blockchain transaction hash
- `proofCode` - Unique shareable verification code
- `createdAt` - Timestamp of registration

**Schema Configuration**: PostgreSQL dialect configured via Drizzle Kit, expecting `DATABASE_URL` environment variable. Schema definitions use Drizzle-Zod for automatic validation schema generation.

**Migration Strategy**: Migrations generated to `./migrations` directory. Currently using in-memory storage but architecture supports switching to Postgres by provisioning a database and running `npm run db:push`.

### Development Environment

**Replit Integration**: 
- Custom Vite plugins for Replit-specific features (runtime error overlay, cartographer, dev banner)
- Development server proxies API requests from frontend to backend
- Hot module replacement enabled for frontend development

**Build Process**:
- Frontend: Vite bundles React app to `dist/public`
- Backend: esbuild compiles server code to `dist/index.js` as ESM bundle
- Production mode serves static files from Express

**Environment Configuration**: Uses `.env` for configuration with placeholder support for future Walrus API keys and Sui RPC URLs.

## External Dependencies

### Third-Party Services (Planned Integration)

**Seal Encryption** (NEW):
- Purpose: Encrypt PDF files with access control policies
- Current State: Mocked in `sealService.ts` using Node.js crypto (AES-256-GCM)
- Integration Point: Replace mock with official Seal SDK when available
- Expected SDK: `@seal/sdk` or similar (hypothetical)
- Expected Implementation: On-chain policy objects on Sui, wallet-based access control
- Documentation: https://docs.seal.io (when available)
- **Mock Features**:
  - `encryptPDF()` - AES-256-GCM encryption with random key
  - `getDecryptionKey()` - Access control check (auto-approves in MVP)
  - `decryptPDF()` - AES-256-GCM decryption

**Walrus Decentralized Storage**:
- Purpose: Store **encrypted** PDF files in decentralized network
- Current State: Mocked in `walrusService.ts` with simulated content IDs and URLs
- Integration Point: Replace mock with official Walrus SDK when available
- Expected SDK: `@walrus/sdk` or similar
- Documentation: https://docs.walrus.storage/
- **NOTE**: In mock mode, files are stored in-memory; real Walrus testnet stores publicly

**Sui Blockchain**:
- Purpose: Register immutable proof records with encryption metadata on-chain
- Current State: Mocked in `suiService.ts` with generated transaction hashes
- Integration Point: Replace mock with `@mysten/sui.js` SDK
- Expected Implementation: Move call to smart contract with proof data including Seal object ID
- Documentation: https://docs.sui.io/

### UI and Component Libraries

**Radix UI**: Headless component primitives for accessible UI components (accordions, dialogs, dropdowns, forms, etc.)

**Shadcn UI**: Pre-built component library using Radix UI and Tailwind CSS with "New York" style variant

**Lucide React**: Icon library for consistent iconography throughout the application

**Tailwind CSS**: Utility-first CSS framework with custom configuration for design system

### Development Tools

**TypeScript**: Strict type checking enabled across frontend, backend, and shared code

**Drizzle ORM**: Type-safe database toolkit for PostgreSQL (configured but not actively used with in-memory storage)

**Zod**: Schema validation library used for API request validation and form validation

**Multer**: Express middleware for handling multipart/form-data file uploads

**TanStack Query**: Data fetching and caching library for React

**React Hook Form**: Form state management with performance optimization

**Vite**: Next-generation frontend build tool with fast HMR

**ESBuild**: Extremely fast bundler for backend TypeScript compilation

### Database and Session Management

**@neondatabase/serverless**: Serverless PostgreSQL driver (configured for future use)

**connect-pg-simple**: PostgreSQL session store for Express (available but not currently implemented)

### Notable Design Decisions

1. **Monorepo Structure**: Single repository with `client/`, `server/`, and `shared/` directories enables code sharing and simplified deployment

2. **Seal Encryption Integration** (NEW): Privacy-first design encrypts PDFs before upload, ensuring only authorized parties can view content. Mock implementation uses industry-standard AES-256-GCM with clear path to real Seal SDK integration.

3. **Mock-First Architecture**: Blockchain, storage, and encryption services are mocked with clear integration points, allowing development without external dependencies while maintaining production-ready structure

4. **Type Safety**: Shared schema definitions between frontend and backend using Drizzle-Zod ensures type consistency across the stack

5. **File Validation**: Strict PDF-only validation with size limits protects against malicious uploads

6. **Proof Code Generation**: Unique, shareable proof codes enable public verification without exposing internal IDs

7. **In-Memory Storage**: Development simplicity with clear path to database migration via `IStorage` interface abstraction

8. **Mock Wallet Connect**: For MVP, viewer wallet connection is simulated via text input. Access control validates against stored policies in current implementation.

9. **Professional Design Language**: Modern, trust-focused UI inspired by Linear, Stripe, and Vercel rather than crypto-aesthetic to appeal to professional users

10. **End-to-End Encryption Flow**: Complete encrypt-upload-decrypt cycle implemented with clear separation of concerns between Seal (encryption), Walrus (storage), and Sui (proof registration)