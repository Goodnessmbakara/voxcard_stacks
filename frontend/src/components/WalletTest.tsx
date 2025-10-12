import { useTurnkeyWallet } from "@/context/TurnkeyWalletProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export const WalletTest = () => {
  const { currentAccount, signAndBroadcastTransaction } = useTurnkeyWallet();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const testSigning = async () => {
    if (!currentAccount) {
      setTestResult("❌ No current account");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      console.log("🧪 TESTING - Wallet signing capability...");
      console.log("🧪 TESTING - Account:", {
        walletAccountId: currentAccount.walletAccountId,
        stacksAddress: currentAccount.stacksAddress,
        organizationId: currentAccount.organizationId,
        walletId: currentAccount.walletId,
        path: currentAccount.path
      });

      // Test with a real group creation
      const testTxOptions = {
        contractAddress: "ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1",
        contractName: "voxcard-savings",
        functionName: "create-plan",
        functionArgs: [
          {
            type: "string-utf8",
            value: "Test Group"
          },
          {
            type: "string-utf8", 
            value: "A test savings group created via Turnkey"
          },
          {
            type: "uint128",
            value: "2"
          },
          {
            type: "uint128",
            value: "1000000"
          },
          {
            type: "string-utf8",
            value: "Monthly"
          },
          {
            type: "uint128",
            value: "1"
          },
          {
            type: "uint128",
            value: "0"
          },
          {
            type: "bool",
            value: "false"
          }
        ],
        fee: 300000n, // Higher fee for contract call
      };

      console.log("🧪 TESTING - Attempting test transaction...");
      console.log("🧪 TESTING - Using Stacks address as signWith:", currentAccount.stacksAddress);
      const txid = await signAndBroadcastTransaction(testTxOptions);
      
      console.log("✅ TESTING - Success! Transaction ID:", txid);
      setTestResult(`✅ Success! Transaction ID: ${txid}`);
    } catch (error: any) {
      console.error("❌ TESTING - Failed:", error);
      setTestResult(`❌ Failed: ${error.message}`);
      
      // If Stacks address fails, let's try with walletAccountId
      if (error.message.includes("Could not find any resource to sign with")) {
        console.log("🔄 TESTING - Stacks address failed, trying walletAccountId...");
        try {
          // We need to modify the signing function temporarily to test walletAccountId
          console.log("🔄 TESTING - Would try walletAccountId:", currentAccount.walletAccountId);
          setTestResult(`❌ Stacks address failed. Would try walletAccountId: ${currentAccount.walletAccountId}`);
        } catch (retryError: any) {
          console.error("❌ TESTING - Retry also failed:", retryError);
          setTestResult(`❌ Both attempts failed. Stacks: ${error.message}, WalletAccountId: ${retryError.message}`);
        }
      }
    } finally {
      setIsTesting(false);
    }
  };

  if (!currentAccount) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Signing Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <strong>Current Account:</strong> {currentAccount.stacksAddress}
        </div>
        <div className="text-sm">
          <strong>Wallet Account ID:</strong> {currentAccount.walletAccountId}
        </div>
        
        <Button 
          onClick={testSigning} 
          disabled={isTesting}
          className="w-full"
        >
          {isTesting ? "Creating Group..." : "Test Group Creation"}
        </Button>
        
        {testResult && (
          <div className={`p-3 rounded text-sm ${
            testResult.startsWith("✅") 
              ? "bg-green-50 text-green-800 border border-green-200" 
              : "bg-red-50 text-red-800 border border-red-200"
          }`}>
            {testResult}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
