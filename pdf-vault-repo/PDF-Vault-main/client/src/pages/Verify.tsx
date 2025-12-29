import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useLocation } from "wouter";

const verifyFormSchema = z.object({
  proofCode: z.string().min(10, "Proof code must be at least 10 characters"),
});

type VerifyFormData = z.infer<typeof verifyFormSchema>;

export default function Verify() {
  const [, setLocation] = useLocation();
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<VerifyFormData>({
    resolver: zodResolver(verifyFormSchema),
    defaultValues: {
      proofCode: "",
    },
  });

  const onSubmit = (data: VerifyFormData) => {
    setIsSearching(true);
    // Navigate to the proof page
    setTimeout(() => {
      setLocation(`/p/${data.proofCode.trim()}`);
      setIsSearching(false);
    }, 300);
  };

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-xl">
        <Card className="border-card-border">
          <CardHeader>
            <CardTitle className="text-2xl">Verify PDF Proof</CardTitle>
            <CardDescription>
              Enter a proof code to verify the authenticity of a PDF registration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="proofCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proof Code</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            placeholder="Enter proof code or transaction hash..."
                            className="h-12 pr-12 font-mono"
                            data-testid="input-proof-code"
                          />
                          <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isSearching}
                  data-testid="button-verify-proof"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      Verify Proof
                      <Search className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="mt-6 border-card-border bg-muted/30">
          <CardContent className="pt-6">
            <h3 className="mb-3 font-semibold">How to Verify</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Candidates will share a proof code or verification link</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Enter the code above or click on the shared link</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>View verified details and download the PDF document</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>All data is cryptographically verified on the blockchain</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
