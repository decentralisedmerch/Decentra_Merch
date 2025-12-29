import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ExternalLink, FileText, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/CopyButton";
import type { CVProof } from "@shared/schema";

export default function Success() {
  const params = useParams();
  const proofCode = params.proofCode as string;

  const { data: proof, isLoading } = useQuery<CVProof>({
    queryKey: ["/api/proof", proofCode],
    enabled: !!proofCode,
  });

  const shareableUrl = `${window.location.origin}/p/${proofCode}`;

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="mx-auto max-w-2xl">
          <Card className="border-card-border">
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!proof) {
    return (
      <div className="container py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="mb-4 text-2xl font-bold">Proof Not Found</h1>
          <p className="mb-6 text-muted-foreground">
            The requested proof could not be found.
          </p>
          <Link href="/register">
            <Button data-testid="button-register-another" asChild>
              <span>Register a PDF</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-2xl">
        {/* Success Message */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">PDF Successfully Registered!</h1>
          <p className="text-muted-foreground">
            Your PDF has been registered with blockchain-backed proof.
          </p>
        </div>

        {/* Proof Code Card */}
        <Card className="mb-6 border-card-border">
          <CardHeader>
            <CardTitle className="text-lg">Proof Code (Transaction Hash)</CardTitle>
            <CardDescription>
              Use this code to verify your PDF or share it with others.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 rounded-lg bg-muted p-4">
              <code className="flex-1 font-mono text-sm break-all" data-testid="text-proof-code">
                {proof.proofCode}
              </code>
              <CopyButton text={proof.proofCode} label="Copy" />
            </div>
          </CardContent>
        </Card>

        {/* Secret Access Code Card (if applicable) */}
        {proof.secretAccessCode && (
          <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Copy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <CardTitle className="text-lg">🔑 Secret Access Code</CardTitle>
              </div>
              <CardDescription>
                Anyone with this code can decrypt and view your PDF. Keep it safe!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 rounded-lg bg-background border border-card-border p-4">
                <code className="flex-1 font-mono text-sm break-all font-bold" data-testid="text-secret-code">
                  {proof.secretAccessCode}
                </code>
                <CopyButton text={proof.secretAccessCode} label="Copy Code" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                ⚠️ Share this code only with people you trust to view your PDF
              </p>
            </CardContent>
          </Card>
        )}

        {/* Shareable URL Card */}
        <Card className="mb-6 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-green-600 dark:text-green-400" />
              <CardTitle className="text-lg">🔗 Shareable Verification Link</CardTitle>
            </div>
            <CardDescription>
              Copy this link and share it with others for instant PDF verification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-background border border-card-border p-4">
              <code className="flex-1 font-mono text-sm break-all" data-testid="text-shareable-url">
                {shareableUrl}
              </code>
              <CopyButton text={shareableUrl} label="Copy Link" />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              ✨ Anyone with this link can view and verify your PDF proof
            </p>
          </CardContent>
        </Card>

        {/* Proof Details Card */}
        <Card className="mb-6 border-card-border">
          <CardHeader>
            <CardTitle className="text-lg">Proof Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Wallet Address</p>
                <p className="font-mono text-sm break-all" data-testid="text-wallet-address">
                  {proof.walletAddress}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                <p className="text-sm" data-testid="text-timestamp">
                  {new Date(proof.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">File Hash (SHA-256)</p>
              <p className="font-mono text-sm break-all" data-testid="text-file-hash">
                {proof.fileHash}
              </p>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground">Storage Content ID</p>
              <p className="font-mono text-sm break-all" data-testid="text-content-id">
                {proof.contentId}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className="flex-1">
            <Button variant="outline" className="w-full" data-testid="button-register-another" asChild>
              <span>Register Another PDF</span>
            </Button>
          </Link>
          <Link href={`/p/${proofCode}`} className="flex-1">
            <Button className="w-full" data-testid="button-view-proof" asChild>
              <span className="flex items-center justify-center">
                View Proof Page
                <ExternalLink className="ml-2 h-4 w-4" />
              </span>
            </Button>
          </Link>
        </div>

        {/* Info Box */}
        <Card className="mt-6 border-card-border bg-primary/5">
          <CardContent className="pt-6">
            <h3 className="mb-3 font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Next Steps
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">1.</span>
                <span><strong>Copy the green shareable link</strong> above and include it in your job applications, LinkedIn profile, or resume</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">2.</span>
                <span>Anyone can click the link to <strong>verify your PDF instantly</strong> without any registration</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">3.</span>
                <span>Your PDF is <strong>tamper-proof</strong> and permanently stored on Walrus decentralized storage with blockchain proof</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
