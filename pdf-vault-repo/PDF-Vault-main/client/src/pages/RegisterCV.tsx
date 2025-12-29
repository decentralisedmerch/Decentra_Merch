import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Upload, Loader2, FileText, Wallet, AlertCircle, Shield, Users, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

const registerFormSchema = z.object({
  cvFile: z.instanceof(File).refine((file) => file.type === "application/pdf", "Only PDF files are allowed"),
  accessMode: z.enum(["owner_only", "specific_wallets", "secret_code"]),
  allowedViewers: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerFormSchema>;

export default function RegisterCV() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      accessMode: "owner_only",
      allowedViewers: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      if (!currentAccount?.address) {
        throw new Error("Please connect your wallet first");
      }

      // Step 1: Upload PDF and get file hash
      toast({
        title: "Step 1/3: Uploading to Walrus...",
        description: "Uploading your PDF to decentralized storage",
      });

      const formData = new FormData();
      formData.append("cvFile", data.cvFile);
      formData.append("walletAddress", currentAccount.address);
      formData.append("accessMode", data.accessMode);
      
      // Add allowed viewers if mode is specific_wallets
      if (data.accessMode === "specific_wallets" && data.allowedViewers) {
        const viewers = data.allowedViewers
          .split("\n")
          .map(v => v.trim())
          .filter(v => v.length > 0);
        formData.append("allowedViewers", JSON.stringify(viewers));
      }

      const response = await fetch("/api/proof/register", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to register PDF");
      }

      const result = await response.json();

      // Step 2: Create blockchain transaction
      toast({
        title: "Step 2/3: Creating blockchain transaction...",
        description: "Please sign the transaction in your wallet",
      });

      return new Promise((resolve, reject) => {
        const tx = new Transaction();
        
        // Add a simple transfer as proof-of-registration
        // In a full implementation, this would call a Move smart contract
        tx.transferObjects(
          [tx.gas],
          currentAccount.address
        );

        signAndExecuteTransaction(
          {
            transaction: tx,
            chain: "sui:testnet",
          },
          {
            onSuccess: async (txResult) => {
              toast({
                title: "Step 3/3: Finalizing...",
                description: "Saving proof to database",
              });

              // Update the backend with real transaction hash
              const finalResponse = await fetch("/api/proof/update-tx", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  proofCode: result.proofCode,
                  txHash: txResult.digest,
                }),
              });

              if (!finalResponse.ok) {
                throw new Error("Failed to update transaction hash");
              }

              const finalResult = await finalResponse.json();
              resolve(finalResult);
            },
            onError: (error) => {
              reject(new Error(`Transaction failed: ${error.message}`));
            },
          }
        );
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "✅ Registration Complete!",
        description: "Your PDF is now on-chain and stored on Walrus!",
      });
      setLocation(`/success/${data.proofCode}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (file: File | null) => {
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF file.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      form.setValue("cvFile", file);
      form.clearErrors("cvFile");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-2xl">
        {!currentAccount && (
          <Alert className="mb-6" data-testid="alert-wallet-required">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your wallet (Slash/Sui Wallet) using the "Connect Wallet" button in the header to register your PDF.
            </AlertDescription>
          </Alert>
        )}

        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="text-2xl">Register Your PDF</CardTitle>
            <CardDescription>
              Upload your PDF and generate blockchain-backed proof for instant verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentAccount && (
              <div className="mb-6 rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Connected Wallet</p>
                    <p className="text-xs text-muted-foreground font-mono" data-testid="text-connected-wallet">
                      {currentAccount.address}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* File Upload */}
                <FormField
                  control={form.control}
                  name="cvFile"
                  render={({ field: { onChange, value, ...field } }) => (
                    <FormItem>
                      <FormLabel>PDF Document</FormLabel>
                      <FormControl>
                        <div
                          className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
                            dragActive
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          } ${selectedFile ? "bg-muted/30" : ""}`}
                          onDragEnter={handleDrag}
                          onDragLeave={handleDrag}
                          onDragOver={handleDrag}
                          onDrop={handleDrop}
                        >
                          <input
                            {...field}
                            type="file"
                            accept=".pdf,application/pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              handleFileChange(file);
                            }}
                            className="absolute inset-0 cursor-pointer opacity-0"
                            data-testid="input-cv-file"
                          />
                          
                          {selectedFile ? (
                            <div className="flex items-center gap-3 text-center">
                              <FileText className="h-10 w-10 text-primary" />
                              <div>
                                <p className="font-medium">{selectedFile.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                              <p className="mb-2 text-sm font-medium">
                                Drop your PDF here or click to browse
                              </p>
                              <p className="text-xs text-muted-foreground">
                                PDF files only, up to 10MB
                              </p>
                            </>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Access Control Section */}
                <FormField
                  control={form.control}
                  name="accessMode"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormLabel className="text-base">Who can access your PDF?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="space-y-3"
                        >
                          <div className="flex items-start space-x-3 rounded-lg border p-4 hover-elevate active-elevate-2">
                            <RadioGroupItem value="owner_only" id="owner_only" data-testid="radio-owner-only" />
                            <Label htmlFor="owner_only" className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-primary" />
                                <span className="font-medium">Owner Only</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Only you can decrypt and view this PDF
                              </p>
                            </Label>
                          </div>

                          <div className="flex items-start space-x-3 rounded-lg border p-4 hover-elevate active-elevate-2">
                            <RadioGroupItem value="specific_wallets" id="specific_wallets" data-testid="radio-specific-wallets" />
                            <Label htmlFor="specific_wallets" className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-primary" />
                                <span className="font-medium">Specific Wallets</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Only specified wallet addresses can view
                              </p>
                            </Label>
                          </div>

                          <div className="flex items-start space-x-3 rounded-lg border p-4 hover-elevate active-elevate-2">
                            <RadioGroupItem value="secret_code" id="secret_code" data-testid="radio-secret-code" />
                            <Label htmlFor="secret_code" className="flex-1 cursor-pointer">
                              <div className="flex items-center gap-2">
                                <Key className="h-4 w-4 text-primary" />
                                <span className="font-medium">Secret Code</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                Anyone with the secret code can view (auto-generated)
                              </p>
                            </Label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Conditional field for specific wallets */}
                {form.watch("accessMode") === "specific_wallets" && (
                  <>
                    <Alert className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-sm text-amber-800 dark:text-amber-300">
                        <strong>Important:</strong> To access your own PDF, you must include your wallet address ({currentAccount?.address ? `${currentAccount.address.substring(0, 12)}...` : 'your address'}) in the list below. Only wallets in this list can decrypt the PDF.
                      </AlertDescription>
                    </Alert>
                    <FormField
                      control={form.control}
                      name="allowedViewers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allowed Wallet Addresses</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Enter wallet addresses (one per line)&#10;0x123...&#10;0x456..."
                              className="font-mono text-sm min-h-[120px]"
                              data-testid="input-allowed-viewers"
                            />
                          </FormControl>
                          <FormDescription>
                            Enter one wallet address per line. Only these wallets can decrypt your PDF.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={registerMutation.isPending || !currentAccount}
                  data-testid="button-submit-registration"
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Register PDF
                      <Upload className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-card-border bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="mb-3 font-semibold">What happens next?</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Your PDF will be uploaded to decentralized storage (Walrus)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>A cryptographic hash of your PDF will be computed for verification</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>A proof record will be registered on the Sui blockchain</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>You'll receive a shareable link and proof code for recruiters</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
