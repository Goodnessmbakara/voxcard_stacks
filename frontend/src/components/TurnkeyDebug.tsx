import { useTurnkeyWallet } from "@/context/TurnkeyWalletProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RateLimitNotice } from "@/components/RateLimitNotice";
import { useState } from "react";

export const TurnkeyDebug = () => {
  const {
    isConnected,
    isAuthenticated,
    hasAccount,
    accounts,
    currentAccount,
    address,
    balance,
    createWallet,
    connectWithPasskey,
  } = useTurnkeyWallet();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [isCreating, setIsCreating] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const handleCreateWallet = async () => {
    setIsCreating(true);
    setLastError(null);
    try {
      await createWallet("VoxCard Debug Wallet");
    } catch (error: any) {
      console.error("Wallet creation failed:", error);
      setLastError(error.message || "Unknown error");
    } finally {
      setIsCreating(false);
    }
  };

  const handleConnect = async () => {
    try {
      await connectWithPasskey();
    } catch (error) {
      console.error("Connection failed:", error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Force a page reload to clear any cached rate limiting
      window.location.reload();
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Turnkey Wallet Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lastError?.includes("Resource exhausted") && <RateLimitNotice />}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Authentication:</strong> {isAuthenticated ? "✅ Connected" : "❌ Not Connected"}
            </div>
            <div>
              <strong>Wallet:</strong> {hasAccount ? "✅ Has Account" : "❌ No Account"}
            </div>
            <div>
              <strong>Connection:</strong> {isConnected ? "✅ Connected" : "❌ Not Connected"}
            </div>
            <div>
              <strong>Address:</strong> {address || "None"}
            </div>
            <div>
              <strong>Balance:</strong> {balance || "None"}
            </div>
            <div>
              <strong>Accounts Count:</strong> {accounts.length}
            </div>
          </div>

          {currentAccount && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <h4 className="font-semibold mb-2">Current Account Details:</h4>
              <div className="text-sm space-y-1">
                <div><strong>Wallet ID:</strong> {currentAccount.walletId}</div>
                <div><strong>Wallet Account ID:</strong> {currentAccount.walletAccountId}</div>
                <div><strong>Organization ID:</strong> {currentAccount.organizationId}</div>
                <div><strong>Stacks Address:</strong> {currentAccount.stacksAddress}</div>
                <div><strong>Public Key:</strong> {currentAccount.publicKey?.substring(0, 20)}...</div>
                <div><strong>Curve:</strong> {currentAccount.curve}</div>
                <div><strong>Path:</strong> {currentAccount.path}</div>
              </div>
            </div>
          )}

          {accounts.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">All Accounts:</h4>
              {accounts.map((account, index) => (
                <div key={index} className="text-sm p-2 bg-gray-50 rounded mb-2">
                  <div><strong>#{index + 1}:</strong> {account.walletAccountId}</div>
                  <div>Address: {account.stacksAddress}</div>
                  <div>Organization: {account.organizationId}</div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 flex-wrap">
            {!isAuthenticated && (
              <Button onClick={handleConnect} variant="outline">
                Connect with Passkey
              </Button>
            )}
            {isAuthenticated && !hasAccount && (
              <Button onClick={handleCreateWallet} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Wallet"}
              </Button>
            )}
            {currentAccount && (
              <Button 
                onClick={() => {
                  console.log("🔍 CURRENT ACCOUNT DETAILS:", {
                    walletAccountId: currentAccount.walletAccountId,
                    stacksAddress: currentAccount.stacksAddress,
                    organizationId: currentAccount.organizationId,
                    walletId: currentAccount.walletId,
                    publicKey: currentAccount.publicKey,
                    curve: currentAccount.curve,
                    path: currentAccount.path
                  });
                }} 
                variant="secondary"
              >
                Log Account Details
              </Button>
            )}
            <Button 
              onClick={handleRefresh} 
              disabled={isRefreshing}
              variant="outline"
            >
              {isRefreshing ? "Refreshing..." : "Clear Rate Limits"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
