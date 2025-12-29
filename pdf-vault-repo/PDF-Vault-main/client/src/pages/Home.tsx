import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Link as LinkIcon, CheckCircle2, Upload, Search, FileCheck, Lock, Zap, Award, Verified, Globe, Github, Twitter } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Premium Hero Section */}
      <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden">
        {/* Advanced Gradient Background with Visual Depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-primary/5 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/12 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-accent/8 via-transparent to-transparent pointer-events-none" />
        
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] opacity-20 pointer-events-none" />
        
        <div className="container relative">
          <div className="mx-auto max-w-4xl">
            {/* Trust Badge with Premium Styling */}
            <div className="mb-8 flex justify-center">
              <Badge className="gap-2 px-4 py-2 text-sm font-semibold border-primary/40 bg-primary/10 text-primary hover:bg-primary/15 shadow-sm">
                <Award className="h-4 w-4" />
                Enterprise-Grade Verification
                <Verified className="h-4 w-4" />
              </Badge>
            </div>
            
            {/* Power Headline with Better Hierarchy */}
            <h1 className="mb-6 text-center text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
              Tamper-Proof <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">PDF Verification</span>
            </h1>
            
            {/* Stronger, Cleaner Tagline */}
            <p className="mb-4 text-center text-xl sm:text-2xl font-semibold text-foreground/90">
              On-chain proof for documents you can trust.
            </p>
            
            {/* Simplified Supporting Copy */}
            <p className="mb-10 text-center text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Upload once. Verify forever. Encrypted storage on Walrus, immutable proof on Sui blockchain.
            </p>
            
            {/* Premium CTA Buttons with Visual Prominence */}
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center mb-12">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto font-semibold" 
                  data-testid="button-hero-register" 
                  asChild
                >
                  <span className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Register Your PDF
                  </span>
                </Button>
              </Link>
              <Link href="/verify">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="w-full sm:w-auto font-semibold" 
                  data-testid="button-hero-verify" 
                  asChild
                >
                  <span className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Verify a PDF
                  </span>
                </Button>
              </Link>
            </div>

            {/* Social Proof / Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span>Blockchain Secured</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span>Decentralized Storage</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                <span>Instant Verification</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Steps Section (Mini How It Works) */}
      <section className="py-12 border-y bg-muted/20">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-xl shadow-lg">
                1
              </div>
              <h3 className="mb-2 font-semibold text-lg">Upload PDF</h3>
              <p className="text-sm text-muted-foreground">Connect wallet and upload your document</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-xl shadow-lg">
                2
              </div>
              <h3 className="mb-2 font-semibold text-lg">On-Chain Proof Created</h3>
              <p className="text-sm text-muted-foreground">Blockchain verification registered</p>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-bold text-xl shadow-lg">
                3
              </div>
              <h3 className="mb-2 font-semibold text-lg">Share Verification Link</h3>
              <p className="text-sm text-muted-foreground">Instant proof for recruiters</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-semibold">Why Choose On-Chain PDF Proof?</h2>
          
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-card-border">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Tamper-Proof Security</h3>
                <p className="text-muted-foreground">
                  Your PDF is hashed and stored with blockchain verification, making it impossible to forge or modify.
                </p>
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <LinkIcon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Decentralized Storage</h3>
                <p className="text-muted-foreground">
                  PDFs are encrypted and stored on Walrus, ensuring permanent availability without relying on central servers.
                </p>
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardContent className="pt-6">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">Instant Verification</h3>
                <p className="text-muted-foreground">
                  Recruiters can verify authenticity in seconds using a simple shareable link or proof code.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-semibold">How It Works</h2>
          
          <div className="grid gap-12 lg:grid-cols-2">
            {/* For Candidates */}
            <div>
              <h3 className="mb-6 text-2xl font-semibold">For Candidates</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Upload Your PDF</h4>
                    <p className="text-sm text-muted-foreground">
                      Upload your PDF file to our secure platform.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Provide Wallet Address</h4>
                    <p className="text-sm text-muted-foreground">
                      Enter your blockchain wallet address to claim ownership.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Get Proof Code</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive a unique proof code and shareable link for verification.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    4
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Share with Recruiters</h4>
                    <p className="text-sm text-muted-foreground">
                      Include the proof link in your job applications for instant credibility.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* For Recruiters */}
            <div>
              <h3 className="mb-6 text-2xl font-semibold">For Recruiters</h3>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    1
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Receive Proof Link</h4>
                    <p className="text-sm text-muted-foreground">
                      Candidates share their unique verification link with you.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    2
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Verify Authenticity</h4>
                    <p className="text-sm text-muted-foreground">
                      View blockchain proof details including wallet, timestamp, and hash.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    3
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Access PDF Document</h4>
                    <p className="text-sm text-muted-foreground">
                      Download the verified PDF directly from decentralized storage.
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                    4
                  </div>
                  <div>
                    <h4 className="mb-1 font-semibold">Hire with Confidence</h4>
                    <p className="text-sm text-muted-foreground">
                      Make informed decisions based on verified, tamper-proof credentials.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-semibold">Ready to Get Started?</h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Join the future of verifiable documents with blockchain-backed PDF proof.
            </p>
            <Link href="/register">
              <Button size="lg" className="font-semibold" data-testid="button-cta-register" asChild>
                <span className="flex items-center gap-2">
                  Register Your PDF Now
                  <FileCheck className="h-5 w-5" />
                </span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Premium Footer with Trust Signals */}
      <footer className="border-t bg-gradient-to-b from-background to-muted/20">
        <div className="container">
          {/* Footer Links & Info */}
          <div className="py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
              {/* Brand Column */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="font-bold text-lg">PDF Proof Vault</span>
                </div>
                <p className="text-sm text-muted-foreground mb-4 max-w-sm">
                  Enterprise-grade PDF verification powered by blockchain technology. 
                  Secure, transparent, and trusted by professionals worldwide.
                </p>
                <div className="flex items-center gap-3">
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-github">
                    <Github className="h-5 w-5" />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-twitter">
                    <Twitter className="h-5 w-5" />
                  </a>
                  <a href="https://walrus.xyz" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="link-walrus">
                    <Globe className="h-5 w-5" />
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold mb-3 text-sm">Product</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/register" data-testid="footer-link-register"><span className="hover:text-foreground transition-colors cursor-pointer">Register PDF</span></Link></li>
                  <li><Link href="/verify" data-testid="footer-link-verify"><span className="hover:text-foreground transition-colors cursor-pointer">Verify PDF</span></Link></li>
                  <li><Link href="/profile" data-testid="footer-link-profile"><span className="hover:text-foreground transition-colors cursor-pointer">My Profile</span></Link></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="font-semibold mb-3 text-sm">Resources</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="https://docs.walrus.xyz" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" data-testid="footer-link-walrus-docs">Walrus Docs</a></li>
                  <li><a href="https://docs.sui.io" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors" data-testid="footer-link-sui-docs">Sui Docs</a></li>
                  <li><a href="#how-it-works" className="hover:text-foreground transition-colors" data-testid="footer-link-how">How It Works</a></li>
                </ul>
              </div>
            </div>

            {/* Copyright Bar */}
            <div className="pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                © 2024 PDF Proof Vault. All rights reserved.
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</span>
                <span className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
