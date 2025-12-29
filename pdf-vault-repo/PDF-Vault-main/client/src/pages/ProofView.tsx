import { useState } from "react";
import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CopyButton } from "@/components/CopyButton";
import { 
  Shield, 
  Clock, 
  Hash,
  AlertCircle,
  Wallet,
  Lock,
  Unlock,
  FileText,
  ExternalLink,
  Key
} from "lucide-react";
import type { CVProof } from "@shared/schema";

export default function ProofView() {
  const [, params] = useRoute("/p/:proofCode");
  const proofCode = params?.proofCode || "";
  
  // Mock wallet state (in production, this would use real wallet connection)
  const [mockWalletAddress, setMockWalletAddress] = useState("");
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [secretAccessCode, setSecretAccessCode] = useState("");
  const [authMethod, setAuthMethod] = useState<"wallet" | "secret_code">("wallet");
  const [decryptedPdfUrl, setDecryptedPdfUrl] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  // Fetch proof metadata
  const { data: proof, isLoading, error } = useQuery<CVProof>({
    queryKey: ["/api/proof", proofCode],
    enabled: !!proofCode,
  });

  const handleMockWalletConnect = () => {
    if (!mockWalletAddress.trim()) {
      alert("Please enter a wallet address");
      return;
    }
    setIsWalletConnected(true);
  };

  const handleDecryptAndView = async () => {
    if (!proof) return;
    
    setIsDecrypting(true);
    setDecryptError(null);

    try {
      // Build query params based on auth method
      const params = new URLSearchParams();
      if (authMethod === "wallet" && mockWalletAddress) {
        params.append("viewerAddress", mockWalletAddress);
      } else if (authMethod === "secret_code" && secretAccessCode) {
        params.append("secretAccessCode", secretAccessCode);
      }
      
      const url = `/api/proof/${proofCode}/decrypted?${params.toString()}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("Access denied. Invalid credentials.");
        }
        throw new Error("Failed to decrypt PDF");
      }

      // Create a blob URL for the decrypted PDF
      const pdfBlob = await response.blob();
      const blobUrl = URL.createObjectURL(pdfBlob);
      setDecryptedPdfUrl(blobUrl);
    } catch (err) {
      console.error("Decryption error:", err);
      setDecryptError(err instanceof Error ? err.message : "Failed to decrypt PDF");
    } finally {
      setIsDecrypting(false);
    }
  };

  const truncateHash = (hash: string, startChars = 12, endChars = 12) => {
    if (hash.length <= startChars + endChars) return hash;
    return `${hash.substring(0, startChars)}...${hash.substring(hash.length - endChars)}`;
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !proof) {
    return (
      <div className="container py-12">
        <div className="mx-auto max-w-3xl">
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 rounded-full bg-destructive/10 p-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">Proof Not Found</h3>
              <p className="mb-6 text-sm text-muted-foreground max-w-md">
                The PDF proof you're looking for doesn't exist or has been removed.
              </p>
              <Button variant="outline" onClick={() => window.location.href = "/"} data-testid="button-go-home">
                Go to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Check if PDF is owner-only (cannot be accessed via proof link)
  const isOwnerOnly = !proof.secretAccessCode && (!proof.allowedViewers || proof.allowedViewers.length === 0);

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-5xl">
        {/* Proof Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">PDF Proof Verification</h1>
          </div>
          <p className="text-muted-foreground">
            Blockchain-verified PDF with encrypted storage
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Proof Status Card */}
            <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400">
                      <Shield className="h-5 w-5" />
                      Proof Verified
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-2 text-green-700 dark:text-green-500">
                      <Clock className="h-3.5 w-3.5" />
                      Registered {formatDate(proof.createdAt)}
                    </CardDescription>
                  </div>
                  <Badge className="gap-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-700">
                    <Lock className="h-3 w-3" />
                    Encrypted
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Owner-Only Mode Warning */}
            {isOwnerOnly && !decryptedPdfUrl && (
              <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-400">
                    <Lock className="h-5 w-5" />
                    Owner-Only PDF
                  </CardTitle>
                  <CardDescription className="text-amber-700 dark:text-amber-500">
                    This PDF is set to owner-only mode
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-background p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-foreground">
                          This PDF cannot be accessed via proof link
                        </p>
                        <p className="text-sm text-muted-foreground">
                          The PDF owner has restricted access to owner-only mode. Only the owner can view this PDF through their profile page.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p className="mb-2 font-medium">If you are the owner:</p>
                    <ul className="space-y-1 list-disc list-inside ml-2">
                      <li>Connect your wallet on this site</li>
                      <li>Navigate to your Profile page</li>
                      <li>Find this PDF and click "View PDF (Decrypt)"</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Access Control - Wallet or Secret Code */}
            {!isOwnerOnly && !isWalletConnected && !decryptedPdfUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    Access PDF
                  </CardTitle>
                  <CardDescription>
                    Choose how to authenticate and decrypt the PDF
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={authMethod} onValueChange={(v) => setAuthMethod(v as "wallet" | "secret_code")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="wallet" data-testid="tab-wallet">
                        <Wallet className="h-4 w-4 mr-2" />
                        Wallet
                      </TabsTrigger>
                      <TabsTrigger value="secret_code" data-testid="tab-secret-code">
                        <Key className="h-4 w-4 mr-2" />
                        Secret Code
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="wallet" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="walletAddress">Wallet Address</Label>
                        <Input
                          id="walletAddress"
                          placeholder="0x..."
                          value={mockWalletAddress}
                          onChange={(e) => setMockWalletAddress(e.target.value)}
                          data-testid="input-wallet-address"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter your wallet address to verify access
                        </p>
                      </div>
                      {decryptError && (
                        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <p>{decryptError}</p>
                          </div>
                        </div>
                      )}
                      <Button 
                        onClick={() => {
                          setIsWalletConnected(true);
                          handleDecryptAndView();
                        }}
                        className="w-full gap-2"
                        disabled={!mockWalletAddress.trim() || isDecrypting}
                        data-testid="button-connect-wallet"
                      >
                        {isDecrypting ? (
                          <>
                            <Key className="h-4 w-4 animate-spin" />
                            Decrypting...
                          </>
                        ) : (
                          <>
                            <Wallet className="h-4 w-4" />
                            Connect & Decrypt
                          </>
                        )}
                      </Button>
                    </TabsContent>
                    
                    <TabsContent value="secret_code" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label htmlFor="secretCode">Secret Access Code</Label>
                        <Input
                          id="secretCode"
                          type="password"
                          placeholder="Enter secret code..."
                          value={secretAccessCode}
                          onChange={(e) => setSecretAccessCode(e.target.value)}
                          data-testid="input-secret-code"
                        />
                        <p className="text-xs text-muted-foreground">
                          If the PDF owner shared a secret code with you, enter it here
                        </p>
                      </div>
                      {decryptError && (
                        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <p>{decryptError}</p>
                          </div>
                        </div>
                      )}
                      <Button 
                        onClick={handleDecryptAndView}
                        className="w-full gap-2"
                        disabled={!secretAccessCode.trim() || isDecrypting}
                        data-testid="button-decrypt-with-code"
                      >
                        {isDecrypting ? (
                          <>
                            <Key className="h-4 w-4 animate-spin" />
                            Decrypting...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Decrypt & View
                          </>
                        )}
                      </Button>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {decryptedPdfUrl && (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Unlock className="h-5 w-5 text-green-600 dark:text-green-400" />
                    Wallet Connected
                  </CardTitle>
                  <CardDescription className="font-mono text-xs break-all">
                    {mockWalletAddress}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!decryptedPdfUrl ? (
                    <>
                      {decryptError && (
                        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                            <p>{decryptError}</p>
                          </div>
                        </div>
                      )}
                      <Button 
                        onClick={handleDecryptAndView}
                        disabled={isDecrypting}
                        className="w-full gap-2"
                        size="lg"
                        data-testid="button-decrypt-view"
                      >
                        {isDecrypting ? (
                          <>
                            <Key className="h-4 w-4 animate-spin" />
                            Decrypting PDF...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Decrypt & View PDF
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-center text-muted-foreground">
                        🔒 PDF is encrypted with Seal. Access control verified on-chain.
                      </p>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10 p-3">
                        <Unlock className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <p className="text-sm font-medium text-green-800 dark:text-green-400">
                          PDF successfully decrypted and loaded
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => window.open(decryptedPdfUrl, "_blank")}
                        data-testid="button-open-new-tab"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open in New Tab
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* PDF Viewer */}
            {decryptedPdfUrl && (
              <Card>
                <CardHeader>
                  <CardTitle>Decrypted PDF</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full h-[600px] border rounded-lg overflow-hidden">
                    <iframe
                      src={decryptedPdfUrl}
                      className="w-full h-full"
                      title="Decrypted PDF"
                      data-testid="iframe-cv"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Proof Details */}
          <div className="space-y-6">
            {/* Owner */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Owner</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-xs break-all text-muted-foreground" data-testid="text-owner">
                  {proof.walletAddress}
                </p>
              </CardContent>
            </Card>

            {/* Proof Code */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Proof Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-mono text-xs break-all text-muted-foreground" data-testid="text-proof-code">
                  {truncateHash(proof.proofCode, 8, 8)}
                </p>
                <CopyButton text={proof.proofCode} label="Copy Code" />
              </CardContent>
            </Card>

            {/* File Hash */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  File Hash
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-xs break-all text-muted-foreground" data-testid="text-file-hash">
                  {truncateHash(proof.fileHash, 10, 10)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  SHA-256 hash of original PDF
                </p>
              </CardContent>
            </Card>

            {/* Seal Object */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Seal Object
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-xs break-all text-muted-foreground" data-testid="text-seal-object">
                  {truncateHash(proof.sealObjectId, 10, 10)}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Encryption policy object ID
                </p>
              </CardContent>
            </Card>

            {/* Transaction */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Transaction</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-xs break-all text-muted-foreground mb-2" data-testid="text-tx-hash">
                  {truncateHash(proof.txHash, 8, 8)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => window.open(`https://suiscan.xyz/testnet/tx/${proof.txHash}`, "_blank")}
                  data-testid="button-view-tx"
                >
                  <ExternalLink className="h-3 w-3" />
                  View on Suiscan
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
