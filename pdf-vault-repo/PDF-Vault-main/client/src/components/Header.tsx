import { Link, useLocation } from "wouter";
import { Shield, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ConnectButton, useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";

function WalletButton() {
  const currentAccount = useCurrentAccount();
  const [, setLocation] = useLocation();
  const { mutate: disconnect } = useDisconnectWallet();

  if (!currentAccount) {
    return <ConnectButton data-testid="button-connect-wallet" />;
  }

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className="gap-2"
          data-testid="button-profile"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Profile</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">My Wallet</p>
            <p className="text-xs leading-none text-muted-foreground font-mono">
              {truncateAddress(currentAccount.address)}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => setLocation("/profile")}
          data-testid="menu-item-profile"
        >
          <User className="mr-2 h-4 w-4" />
          <span>View Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={() => disconnect()}
          className="text-destructive focus:text-destructive"
          data-testid="menu-item-disconnect"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Disconnect Wallet</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/98 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-20 items-center justify-between">
        {/* Premium Logo/Brand */}
        <Link href="/" data-testid="link-home">
          <div className="flex items-center gap-3 font-bold text-xl hover-elevate active-elevate-2 rounded-lg px-4 py-2 -ml-4 transition-all cursor-pointer group">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="hidden md:inline text-base font-bold leading-tight">PDF Proof Vault</span>
              <span className="hidden md:inline text-xs text-muted-foreground font-normal">On-Chain Verification</span>
              <span className="md:hidden text-base font-bold">PDF Vault</span>
            </div>
          </div>
        </Link>
        
        {/* Premium Navigation */}
        <nav className="flex items-center gap-3">
          <Link href="/register">
            <Button
              variant={location === "/register" ? "default" : "ghost"}
              size="default"
              className="font-medium"
              data-testid="button-register"
              asChild
            >
              <span>Register PDF</span>
            </Button>
          </Link>
          <Link href="/verify">
            <Button
              variant={location === "/verify" ? "default" : "ghost"}
              size="default"
              className="font-medium"
              data-testid="button-verify"
              asChild
            >
              <span>Verify</span>
            </Button>
          </Link>
          <WalletButton />
        </nav>
      </div>
    </header>
  );
}
