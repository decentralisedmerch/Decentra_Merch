import { useWallets } from "@mysten/dapp-kit";

export function WalletDebug() {
  const wallets = useWallets();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-background border rounded-lg shadow-lg max-w-md">
      <h3 className="font-bold mb-2">Detected Wallets ({wallets.length})</h3>
      <div className="space-y-2 text-sm">
        {wallets.map((wallet) => (
          <div key={wallet.name} className="flex items-center gap-2">
            {wallet.icon && (
              <img src={wallet.icon} alt={wallet.name} className="w-6 h-6" />
            )}
            <span>{wallet.name}</span>
          </div>
        ))}
        {wallets.length === 0 && (
          <p className="text-muted-foreground">No wallets detected</p>
        )}
      </div>
    </div>
  );
}
