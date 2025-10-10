import { createContext, useContext, ReactNode, useState, useEffect, useCallback } from "react";
import { TurnkeyBrowserClient } from "@turnkey/sdk-browser";
import { useTurnkey } from "@turnkey/sdk-react";
import { StacksTestnet, StacksMainnet } from "@stacks/network";
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  SignedContractCallOptions,
  makeSTXTokenTransfer,
} from "@stacks/transactions";
import { toast } from "@/hooks/use-toast";

// Network configuration
const isMainnet = import.meta.env.VITE_STACKS_NETWORK === "mainnet";
const network = isMainnet ? new StacksMainnet() : new StacksTestnet();

// Turnkey configuration
const TURNKEY_API_BASE_URL = import.meta.env.VITE_TURNKEY_API_BASE_URL || "https://api.turnkey.com";
const TURNKEY_ORGANIZATION_ID = import.meta.env.VITE_TURNKEY_ORGANIZATION_ID || "";

interface TurnkeyWallet {
  walletId: string;
  walletName: string;
  accounts: Array<{
    address: string;
    addressFormat: string;
    path: string;
  }>;
}

interface TurnkeyWalletContextProps {
  // Wallet State
  isConnected: boolean;
  address: string | null;
  balance: string;
  wallets: TurnkeyWallet[];
  currentWallet: TurnkeyWallet | null;
  isInitializing: boolean;

  // Authentication & Wallet Management
  createWallet: (walletName?: string) => Promise<void>;
  connectWithPasskey: () => Promise<void>;
  disconnectWallet: () => void;
  switchWallet: (walletId: string) => void;

  // Stacks Transaction Methods
  signAndBroadcastTransaction: (txOptions: any) => Promise<string>;
  sendSTX: (recipient: string, amount: bigint, memo?: string) => Promise<string>;
  
  // sBTC Methods
  getSBTCBalance: () => Promise<string>;
  
  // Turnkey Client
  turnkeyClient: TurnkeyBrowserClient | null;
  network: typeof network;
}

const TurnkeyWalletContext = createContext<TurnkeyWalletContextProps | null>(null);

export const TurnkeyWalletProvider = ({ children }: { children: ReactNode }) => {
  const [wallets, setWallets] = useState<TurnkeyWallet[]>([]);
  const [currentWallet, setCurrentWallet] = useState<TurnkeyWallet | null>(null);
  const [balance, setBalance] = useState<string>("--");
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [turnkeyClient, setTurnkeyClient] = useState<TurnkeyBrowserClient | null>(null);

  // Use Turnkey React SDK
  const { turnkey, passkeyClient, authIframeClient } = useTurnkey();

  const address = currentWallet?.accounts?.[0]?.address || null;
  const isConnected = !!currentWallet && !!address;

  // Initialize Turnkey client on mount
  useEffect(() => {
    const initTurnkey = async () => {
      try {
        // Check if we have stored wallet data
        const storedWalletData = localStorage.getItem('voxcard_turnkey_wallet');
        
        if (storedWalletData) {
          const walletData = JSON.parse(storedWalletData);
          setWallets(walletData.wallets || []);
          setCurrentWallet(walletData.currentWallet || null);
        }

        // Initialize Turnkey client
        if (TURNKEY_ORGANIZATION_ID) {
          const client = new TurnkeyBrowserClient({
            apiBaseUrl: TURNKEY_API_BASE_URL,
            organizationId: TURNKEY_ORGANIZATION_ID,
          });
          setTurnkeyClient(client);
        }
      } catch (error) {
        console.error("Error initializing Turnkey:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initTurnkey();
  }, []);

  // Fetch balance when address changes
  useEffect(() => {
    const fetchBalance = async () => {
      if (!address) {
        setBalance("--");
        return;
      }

      try {
        const apiUrl = isMainnet 
          ? `https://api.mainnet.hiro.so/v2/accounts/${address}`
          : `https://api.testnet.hiro.so/v2/accounts/${address}`;
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        // Convert microSTX to STX
        const stxBalance = Number(data.balance) / 1_000_000;
        setBalance(stxBalance.toFixed(2));
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance("--");
      }
    };

    fetchBalance();
  }, [address]);

  // Persist wallet data to localStorage
  const persistWalletData = useCallback((walletsData: TurnkeyWallet[], currentWalletData: TurnkeyWallet | null) => {
    const dataToStore = {
      wallets: walletsData,
      currentWallet: currentWalletData,
      timestamp: Date.now(),
    };
    localStorage.setItem('voxcard_turnkey_wallet', JSON.stringify(dataToStore));
  }, []);

  /**
   * Create a new Turnkey embedded wallet with passkey authentication
   */
  const createWallet = async (walletName?: string) => {
    if (!passkeyClient) {
      toast({
        title: "Initialization Error",
        description: "Turnkey client not initialized. Please check your configuration.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Creating Wallet",
        description: "Please complete the passkey authentication...",
      });

      const name = walletName || `VoxCard Wallet ${Date.now()}`;

      // Create sub-organization with passkey
      // Note: This is a simplified flow - actual implementation will depend on Turnkey SDK version
      const subOrg = await passkeyClient.createSubOrganization({
        subOrganizationName: `VoxCard-User-${Date.now()}`,
        rootUsers: [
          {
            userName: `user-${Date.now()}`,
            authenticators: [
              {
                authenticatorName: "Passkey",
                challenge: generateChallenge(),
                attestation: "direct",
              },
            ],
          },
        ],
      });

      // Create Stacks wallet within the sub-organization
      const wallet = await passkeyClient.createWallet({
        walletName: name,
        accounts: [
          {
            curve: "SECP256K1",
            pathFormat: "BIP32",
            path: "m/44'/5757'/0'/0/0", // Stacks derivation path
            addressFormat: isMainnet ? "MAINNET" : "TESTNET",
          },
        ],
      });

      const newWallet: TurnkeyWallet = {
        walletId: wallet.walletId,
        walletName: name,
        accounts: wallet.addresses.map((addr: any) => ({
          address: addr.address,
          addressFormat: addr.addressFormat,
          path: addr.path,
        })),
      };

      const updatedWallets = [...wallets, newWallet];
      setWallets(updatedWallets);
      setCurrentWallet(newWallet);
      persistWalletData(updatedWallets, newWallet);

      toast({
        title: "Wallet Created!",
        description: `Your embedded wallet has been created successfully.`,
      });
    } catch (error: any) {
      console.error("Error creating wallet:", error);
      toast({
        title: "Wallet Creation Failed",
        description: error.message || "Failed to create wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Connect to existing wallet using passkey
   */
  const connectWithPasskey = async () => {
    if (!passkeyClient) {
      toast({
        title: "Initialization Error",
        description: "Turnkey client not initialized.",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Connecting Wallet",
        description: "Please authenticate with your passkey...",
      });

      // Authenticate with passkey
      const session = await passkeyClient.login({
        organizationId: TURNKEY_ORGANIZATION_ID,
      });

      // Retrieve wallets for the authenticated user
      const walletsResponse = await passkeyClient.getWallets();
      
      if (walletsResponse.wallets && walletsResponse.wallets.length > 0) {
        const userWallets: TurnkeyWallet[] = walletsResponse.wallets.map((w: any) => ({
          walletId: w.walletId,
          walletName: w.walletName,
          accounts: w.accounts || [],
        }));

        setWallets(userWallets);
        setCurrentWallet(userWallets[0]);
        persistWalletData(userWallets, userWallets[0]);

        toast({
          title: "Wallet Connected",
          description: "Successfully connected to your embedded wallet.",
        });
      } else {
        toast({
          title: "No Wallets Found",
          description: "Please create a new wallet first.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error connecting with passkey:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect wallet.",
        variant: "destructive",
      });
    }
  };

  /**
   * Disconnect wallet and clear state
   */
  const disconnectWallet = () => {
    setWallets([]);
    setCurrentWallet(null);
    setBalance("--");
    localStorage.removeItem('voxcard_turnkey_wallet');
    
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  /**
   * Switch between multiple wallets
   */
  const switchWallet = (walletId: string) => {
    const wallet = wallets.find(w => w.walletId === walletId);
    if (wallet) {
      setCurrentWallet(wallet);
      persistWalletData(wallets, wallet);
    }
  };

  /**
   * Sign and broadcast a Stacks transaction
   */
  const signAndBroadcastTransaction = async (txOptions: any): Promise<string> => {
    if (!isConnected || !address || !passkeyClient) {
      throw new Error("Wallet not connected");
    }

    try {
      // Build the transaction
      const transaction = await makeContractCall({
        ...txOptions,
        senderKey: address, // Will be replaced with Turnkey signing
        network,
        anchorMode: txOptions.anchorMode || AnchorMode.Any,
        postConditionMode: txOptions.postConditionMode || PostConditionMode.Allow,
      });

      // Serialize transaction for signing
      const serializedTx = transaction.serialize();

      // Sign with Turnkey
      const signedTx = await passkeyClient.signTransaction({
        type: "ACTIVITY_TYPE_SIGN_RAW_PAYLOAD",
        organizationId: TURNKEY_ORGANIZATION_ID,
        parameters: {
          signWith: address,
          payload: Buffer.from(serializedTx).toString("hex"),
          encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
          hashFunction: "HASH_FUNCTION_NO_OP",
        },
      });

      // Broadcast the signed transaction
      const broadcastResponse = await broadcastTransaction(transaction, network);
      
      toast({
        title: "Transaction Submitted",
        description: `Transaction ID: ${broadcastResponse.txid}`,
      });

      return broadcastResponse.txid;
    } catch (error: any) {
      console.error("Transaction error:", error);
      toast({
        title: "Transaction Failed",
        description: error.message || "Failed to broadcast transaction",
        variant: "destructive",
      });
      throw error;
    }
  };

  /**
   * Send STX to a recipient
   */
  const sendSTX = async (recipient: string, amount: bigint, memo?: string): Promise<string> => {
    if (!isConnected || !address || !passkeyClient) {
      throw new Error("Wallet not connected");
    }

    try {
      const transaction = await makeSTXTokenTransfer({
        recipient,
        amount,
        memo,
        network,
        anchorMode: AnchorMode.Any,
        senderKey: address, // Will be replaced with Turnkey signing
      });

      const serializedTx = transaction.serialize();

      // Sign with Turnkey
      const signedTx = await passkeyClient.signTransaction({
        type: "ACTIVITY_TYPE_SIGN_RAW_PAYLOAD",
        organizationId: TURNKEY_ORGANIZATION_ID,
        parameters: {
          signWith: address,
          payload: Buffer.from(serializedTx).toString("hex"),
          encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
          hashFunction: "HASH_FUNCTION_NO_OP",
        },
      });

      const broadcastResponse = await broadcastTransaction(transaction, network);
      
      toast({
        title: "STX Transfer Submitted",
        description: `Transaction ID: ${broadcastResponse.txid}`,
      });

      return broadcastResponse.txid;
    } catch (error: any) {
      console.error("STX transfer error:", error);
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to send STX",
        variant: "destructive",
      });
      throw error;
    }
  };

  /**
   * Get sBTC balance for the connected wallet
   */
  const getSBTCBalance = async (): Promise<string> => {
    if (!address) {
      return "0";
    }

    try {
      const sbtcContractAddress = import.meta.env.VITE_SBTC_TOKEN_CONTRACT || 
        "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token";
      
      const [contractAddr, contractName] = sbtcContractAddress.split(".");
      
      const apiUrl = isMainnet 
        ? `https://api.mainnet.hiro.so/v2/contracts/call-read/${contractAddr}/${contractName}/get-balance`
        : `https://api.testnet.hiro.so/v2/contracts/call-read/${contractAddr}/${contractName}/get-balance`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: address,
          arguments: [`0x${Buffer.from(address).toString("hex")}`],
        }),
      });

      const data = await response.json();
      
      if (data.okay && data.result) {
        // Parse the result (usually in hex format)
        const balance = parseInt(data.result, 16);
        return (balance / 100_000_000).toFixed(8); // Convert from satoshis to sBTC
      }

      return "0";
    } catch (error) {
      console.error("Error fetching sBTC balance:", error);
      return "0";
    }
  };

  return (
    <TurnkeyWalletContext.Provider
      value={{
        isConnected,
        address,
        balance,
        wallets,
        currentWallet,
        isInitializing,
        createWallet,
        connectWithPasskey,
        disconnectWallet,
        switchWallet,
        signAndBroadcastTransaction,
        sendSTX,
        getSBTCBalance,
        turnkeyClient,
        network,
      }}
    >
      {children}
    </TurnkeyWalletContext.Provider>
  );
};

export const useTurnkeyWallet = () => {
  const ctx = useContext(TurnkeyWalletContext);
  if (!ctx) {
    throw new Error("useTurnkeyWallet must be used within TurnkeyWalletProvider");
  }
  return ctx;
};

/**
 * Generate a random challenge for passkey authentication
 */
function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString("base64");
}

