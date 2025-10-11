import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AuthState,
  type WalletAccount,
  useTurnkey,
} from "@turnkey/react-wallet-kit";
import {
  AnchorMode,
  AuthType,
  PostConditionMode,
  StacksTransaction,
  AddressVersion,
  createMessageSignature,
  createStacksPublicKey,
  makeUnsignedContractCall,
  makeUnsignedSTXTokenTransfer,
  broadcastTransaction,
  txidFromData,
  publicKeyToAddress,
} from "@stacks/transactions";
import { StacksMainnet, StacksTestnet } from "@stacks/network";
import { toast } from "@/hooks/use-toast";

const TURNKEY_STORAGE_KEY = "voxcard_turnkey_wallet_v1";

const isMainnet = import.meta.env.VITE_STACKS_NETWORK === "mainnet";
const network = isMainnet ? new StacksMainnet() : new StacksTestnet();

type AnyWalletAccount = WalletAccount & {
  source?: string;
  address?: string;
  addressFormat?: string;
  publicKey?: string;
};

export interface DerivedStacksAccount {
  walletId: string;
  walletAccountId: string;
  walletName: string;
  organizationId: string;
  curve: string;
  path: string;
  publicKey: string;
  stacksAddress: string;
}

interface TurnkeyWalletContextShape {
  isConnected: boolean;
  isInitializing: boolean;
  accounts: DerivedStacksAccount[];
  currentAccount: DerivedStacksAccount | null;
  address: string | null;
  balance: string;
  network: typeof network;
  createWallet: (walletName?: string) => Promise<void>;
  importWallet: () => Promise<void>;
  connectWithPasskey: () => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchWallet: (walletAccountId: string) => void;
  signAndBroadcastTransaction: (txOptions: any) => Promise<string>;
  sendSTX: (recipient: string, amount: bigint, memo?: string) => Promise<string>;
  getSBTCBalance: () => Promise<string>;
  isAuthenticated: boolean;
  hasAccount: boolean;
}

const TurnkeyWalletContext = createContext<TurnkeyWalletContextShape | null>(null);

function sanitizeHex(value: string, length: number) {
  const stripped = value.startsWith("0x") ? value.slice(2) : value;
  return stripped.padStart(length, "0");
}

function bytesToHexUnsafe(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function hexToBytesUnsafe(hex: string): Uint8Array {
  const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const array = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    array[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return array;
}

function bigIntToBytes(value: bigint, length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  let temp = value;
  for (let i = length - 1; i >= 0; i--) {
    bytes[i] = Number(temp & 0xffn);
    temp >>= 8n;
  }
  return bytes;
}

function deriveStacksAddress(publicKeyHex: string): string {
  const normalized = publicKeyHex.startsWith("0x")
    ? publicKeyHex.slice(2)
    : publicKeyHex;
  const stacksKey = createStacksPublicKey(normalized);
  const version = isMainnet
    ? AddressVersion.MainnetSingleSig
    : AddressVersion.TestnetSingleSig;
  return publicKeyToAddress(version, stacksKey);
}

function isEmbeddedAccount(account: WalletAccount): account is AnyWalletAccount {
  const candidate = account as AnyWalletAccount;
  if (!candidate.source) {
    return true;
  }
  return candidate.source.toUpperCase().includes("EMBEDDED");
}

function resolveStacksCoordinates(account: AnyWalletAccount) {
  const publicKey = account.publicKey ?? null;
  let stacksAddress: string | null = null;

  if (account.address && account.addressFormat?.toUpperCase().includes("STACKS")) {
    stacksAddress = account.address;
  } else if (publicKey) {
    stacksAddress = deriveStacksAddress(publicKey);
  }

  return { publicKey, stacksAddress };
}

const SIGNATURE_PREIMAGE_LENGTH_BYTES = 32 + 1 + 8 + 8;

function buildPreSignHash(
  transaction: StacksTransaction,
  authType: AuthType,
  fee: bigint | number,
  nonce: bigint | number,
): string {
  const curSigHash = transaction.signBegin();
  const authFlagHex = bytesToHexUnsafe(Uint8Array.of(authType));
  const feeHex = bytesToHexUnsafe(bigIntToBytes(BigInt(fee), 8));
  const nonceHex = bytesToHexUnsafe(bigIntToBytes(BigInt(nonce), 8));
  const preimageHex = `${curSigHash}${authFlagHex}${feeHex}${nonceHex}`;
  const preimageBytes = hexToBytesUnsafe(preimageHex);
  if (preimageBytes.byteLength !== SIGNATURE_PREIMAGE_LENGTH_BYTES) {
    throw new Error("Invalid signature preimage length");
  }
  return txidFromData(preimageBytes);
}

function formatStacksSignature(v: string, r: string, s: string): string {
  const vHex = sanitizeHex(v, 2);
  const rHex = sanitizeHex(r, 64);
  const sHex = sanitizeHex(s, 64);
  return `${vHex}${rHex}${sHex}`;
}

async function fetchStacksBalance(address: string): Promise<string> {
  const apiBase = isMainnet
    ? "https://api.mainnet.hiro.so"
    : "https://api.testnet.hiro.so";
  const response = await fetch(`${apiBase}/v2/accounts/${address}`);
  if (!response.ok) {
    throw new Error(`Stacks balance lookup failed: ${response.status}`);
  }
  const data = await response.json();
  const microStx = BigInt(data.balance ?? "0");
  const stx = Number(microStx) / 1_000_000;
  return stx.toFixed(2);
}

async function fetchSbtcBalance(stacksAddress: string): Promise<string> {
  const tokenIdentifier =
    import.meta.env.VITE_SBTC_TOKEN_CONTRACT ??
    "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token";

  const [contractAddress, contractName] = tokenIdentifier.split(".");
  const apiBase = isMainnet
    ? "https://api.mainnet.hiro.so"
    : "https://api.testnet.hiro.so";

  const response = await fetch(
    `${apiBase}/v2/contracts/call-read/${contractAddress}/${contractName}/get-balance`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: stacksAddress,
        arguments: [`0x${Buffer.from(stacksAddress).toString("hex")}`],
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`sBTC balance lookup failed: ${response.status}`);
  }

  const data = await response.json();
  if (data.okay && typeof data.result === "string") {
    const sats = BigInt(data.result);
    const sbtc = Number(sats) / 100_000_000;
    return sbtc.toFixed(8);
  }
  return "0.00000000";
}

type TurnkeySigner = {
  signRawPayload: (input: any) => Promise<any>;
  getWalletAccounts?: (input: any) => Promise<any>;
};

async function signStacksTransactionWithTurnkey(
  transaction: StacksTransaction,
  account: DerivedStacksAccount,
  signer: TurnkeySigner,
): Promise<StacksTransaction> {
  if (!transaction.auth.spendingCondition) {
    throw new Error("Transaction spending condition missing");
  }
  if (!transaction.auth.authType) {
    throw new Error("Transaction auth type missing");
  }
  if (!signer || typeof signer.signRawPayload !== "function") {
    throw new Error("Turnkey signer unavailable");
  }

  const spendingCondition = transaction.auth.spendingCondition;
  const authType = transaction.auth.authType;
  const preSignHash = buildPreSignHash(
    transaction,
    authType,
    spendingCondition.fee,
    spendingCondition.nonce,
  );

  const response = await signer.signRawPayload({
    type: "ACTIVITY_TYPE_SIGN_RAW_PAYLOAD_V2",
    organizationId: account.organizationId,
    timestampMs: Date.now().toString(),
    parameters: {
      signWith: account.walletAccountId ?? account.publicKey,
      payload: preSignHash,
      encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
      hashFunction: "HASH_FUNCTION_SHA256",
    },
  });

  const signResult =
    response?.activity?.result?.signRawPayloadResult ??
    // @ts-expect-error legacy path
    response?.signRawPayloadResult;

  if (!signResult?.r || !signResult?.s || typeof signResult.v === "undefined") {
    throw new Error("Turnkey signature response malformed");
  }

  const signatureHex = formatStacksSignature(signResult.v, signResult.r, signResult.s);
  spendingCondition.signature = createMessageSignature(signatureHex);
  return transaction;
}

export const TurnkeyWalletProvider = ({ children }: { children: ReactNode }) => {
  const {
    authState,
    client,
    passkeyClient,
    walletClient,
    httpClient,
    wallets,
    createWallet: turnkeyCreateWallet,
    handleImportWallet,
    refreshWallets,
    handleLogin,
    logout,
  } = useTurnkey();

  const [accounts, setAccounts] = useState<DerivedStacksAccount[]>([]);
  const [currentAccount, setCurrentAccount] = useState<DerivedStacksAccount | null>(null);
  const [balance, setBalance] = useState<string>("--");
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  const isAuthenticated = authState === AuthState.Authenticated;
  const hasAccount = accounts.length > 0;
  const isConnected = isAuthenticated && !!currentAccount;
  const primaryAddress = currentAccount?.stacksAddress ?? null;

  const resolveSigner = useCallback((): TurnkeySigner => {
    const signerCandidate = (client ?? passkeyClient ?? walletClient ?? httpClient) as TurnkeySigner | undefined;
    if (!signerCandidate || typeof signerCandidate.signRawPayload !== "function") {
      throw new Error("Turnkey signer unavailable. Please sign in again.");
    }
    return signerCandidate;
  }, [client, passkeyClient, walletClient, httpClient]);

  useEffect(() => {
    const cached = localStorage.getItem(TURNKEY_STORAGE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as {
          currentWalletAccountId: string;
        };
        if (parsed.currentWalletAccountId) {
          setCurrentAccount((prev) =>
            prev && prev.walletAccountId === parsed.currentWalletAccountId ? prev : null,
          );
        }
      } catch (error) {
        console.error("Failed to parse cached Turnkey wallet state:", error);
      }
    }
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshWallets().catch((error) => {
        console.error("Failed to refresh Turnkey wallets:", error);
      });
    } else {
      setAccounts([]);
      setCurrentAccount(null);
      setBalance("--");
    }
  }, [isAuthenticated, refreshWallets]);

  const persistSelection = useCallback((walletAccountId: string) => {
    localStorage.setItem(
      TURNKEY_STORAGE_KEY,
      JSON.stringify({ currentWalletAccountId: walletAccountId }),
    );
  }, []);

  useEffect(() => {
    let ignore = false;

    const hydrateAccounts = async () => {
      if (!wallets || wallets.length === 0) {
        if (!ignore) {
          setAccounts([]);
          setCurrentAccount(null);
          setBalance("--");
        }
        return;
      }

      const hydrated = await Promise.all(
        wallets.map(async (wallet) => {
          const walletAccounts = (wallet.accounts as AnyWalletAccount[]) ?? [];
          let embeddedAccounts = walletAccounts.filter(isEmbeddedAccount);
          if (embeddedAccounts.length === 0) {
            embeddedAccounts = walletAccounts;
          }

          const missingDetails = embeddedAccounts.some(
            (account) => !account.walletAccountId || (!account.publicKey && !account.address),
          );

          const accountClient =
            client ?? passkeyClient ?? walletClient ?? httpClient;

          if (
            (embeddedAccounts.length === 0 || missingDetails) &&
            accountClient &&
            typeof accountClient.getWalletAccounts === "function"
          ) {
            try {
              const response = await accountClient.getWalletAccounts({
                organizationId: wallet.organizationId,
                walletId: wallet.walletId,
                includeAddress: true,
                includePublicKey: true,
              } as any);
              const apiAccounts = (response.accounts as AnyWalletAccount[]) ?? [];
              const apiEmbedded = apiAccounts.filter(isEmbeddedAccount);
              embeddedAccounts = apiEmbedded.length ? apiEmbedded : apiAccounts;
            } catch (error) {
              console.error("Failed to fetch wallet accounts from Turnkey:", error);
            }
          }

          return embeddedAccounts
            .filter((account) => account.curve === "CURVE_SECP256K1")
            .map((account) => {
              const { stacksAddress, publicKey } = resolveStacksCoordinates(account);
              if (!stacksAddress && !publicKey) {
                console.warn("[Turnkey] Skipping account without address/public key", account);
                return null;
              }

              const effectivePublicKey = publicKey ?? account.publicKey ?? null;
              if (!effectivePublicKey) {
                console.warn("[Turnkey] Skipping account missing public key", account);
                return null;
              }

              const effectiveStacksAddress =
                stacksAddress ?? deriveStacksAddress(effectivePublicKey);

              const resolvedWalletAccountId =
                account.walletAccountId ??
                account.address ??
                effectivePublicKey;

              if (!resolvedWalletAccountId) {
                console.warn("[Turnkey] Skipping account missing walletAccountId", account);
                return null;
              }

              console.debug(
                "[Turnkey] Hydrated embedded wallet account",
                {
                  walletId: wallet.walletId,
                  walletAccountId: resolvedWalletAccountId,
                  stacksAddress: effectiveStacksAddress,
                  path: account.path,
                },
              );

              return {
                walletId: wallet.walletId,
                walletAccountId: resolvedWalletAccountId,
                walletName: wallet.walletName ?? "Turnkey Wallet",
                organizationId: account.organizationId,
                curve: account.curve,
                path: account.path,
                publicKey: effectivePublicKey,
                stacksAddress: effectiveStacksAddress,
              } as DerivedStacksAccount;
            })
            .filter(Boolean) as DerivedStacksAccount[];
        }),
      );

      if (ignore) return;

      const flattened = hydrated.flat();
      setAccounts(flattened);

      if (flattened.length === 0) {
        setCurrentAccount(null);
        setBalance("--");
        console.warn("[Turnkey] No embedded wallet accounts found after hydration.");
        return;
      }

      const cached = localStorage.getItem(TURNKEY_STORAGE_KEY);
      let preferredAccountId: string | null = null;
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { currentWalletAccountId?: string };
          preferredAccountId = parsed.currentWalletAccountId ?? null;
        } catch {
          preferredAccountId = null;
        }
      }

      const matched =
        preferredAccountId &&
        flattened.find((account) => account.walletAccountId === preferredAccountId);

      const nextAccount = matched ?? flattened[0];
      setCurrentAccount(nextAccount);
      persistSelection(nextAccount.walletAccountId);
      console.info(
        "[Turnkey] Active embedded wallet ready",
        {
          walletAccountId: nextAccount.walletAccountId,
          stacksAddress: nextAccount.stacksAddress,
          path: nextAccount.path,
        },
      );
    };

    hydrateAccounts();

    return () => {
      ignore = true;
    };
  }, [wallets, client, passkeyClient, walletClient, httpClient, persistSelection]);

  useEffect(() => {
    if (!currentAccount) {
      setBalance("--");
      return;
    }

    fetchStacksBalance(currentAccount.stacksAddress)
      .then(setBalance)
      .catch((error) => {
        console.error("Failed to fetch STX balance:", error);
        setBalance("--");
      });
  }, [currentAccount]);

  const createWallet = useCallback(
    async (walletName?: string) => {
      if (authState !== AuthState.Authenticated) {
        toast({
          title: "Not signed in",
          description: "Authenticate before creating a wallet.",
          variant: "destructive",
        });
        return;
      }

      try {
        const name = walletName ?? `VoxCard Wallet ${Date.now()}`;
        await turnkeyCreateWallet({
          walletName: name,
          accounts: [
            {
              curve: "CURVE_SECP256K1",
              pathFormat: "PATH_FORMAT_BIP32",
              path: "m/44'/5757'/0'/0/0",
              addressFormat: "ADDRESS_FORMAT_COMPRESSED",
            },
          ],
        });

        await refreshWallets();
        console.info("[Turnkey] Embedded wallet created. Refreshing accounts…");
        toast({
          title: "Wallet created",
          description: "Your Turnkey embedded wallet is ready.",
        });
      } catch (error: any) {
        console.error("Turnkey wallet creation failed:", error);
        toast({
          title: "Wallet creation failed",
          description: error?.message ?? "Unable to create wallet with Turnkey.",
          variant: "destructive",
        });
      }
    },
    [authState, refreshWallets, turnkeyCreateWallet],
  );

  const connectWithPasskey = useCallback(async () => {
    try {
      await handleLogin();
    } catch (error: any) {
      console.error("Turnkey login failed:", error);
      toast({
        title: "Login failed",
        description: error?.message ?? "Unable to authenticate with Turnkey.",
        variant: "destructive",
      });
    }
  }, [handleLogin]);

  const importWallet = useCallback(async () => {
    try {
      await handleImportWallet();
      await refreshWallets();
      toast({
        title: "Wallet imported",
        description: "Existing wallet accounts have been synced.",
      });
    } catch (error: any) {
      if (error?.code === "USER_CANCELED") {
        return;
      }
      console.error("Turnkey wallet import failed:", error);
      toast({
        title: "Import failed",
        description: error?.message ?? "Unable to import wallet.",
        variant: "destructive",
      });
    }
  }, [handleImportWallet, refreshWallets]);

  const disconnectWallet = useCallback(async () => {
    try {
      await logout();
      localStorage.removeItem(TURNKEY_STORAGE_KEY);
      setCurrentAccount(null);
      setBalance("--");
      toast({
        title: "Disconnected",
        description: "Your embedded wallet has been disconnected.",
      });
    } catch (error: any) {
      console.error("Turnkey logout failed:", error);
      toast({
        title: "Logout failed",
        description: error?.message ?? "Unable to disconnect Turnkey wallet.",
        variant: "destructive",
      });
    }
  }, [logout]);

  const switchWallet = useCallback(
    (walletAccountId: string) => {
      const account = accounts.find((item) => item.walletAccountId === walletAccountId);
      if (account) {
        setCurrentAccount(account);
        persistSelection(walletAccountId);
      }
    },
    [accounts, persistSelection],
  );

  const signAndBroadcastTransaction = useCallback(
    async (txOptions: any) => {
      if (!currentAccount) {
        throw new Error("Turnkey wallet not connected");
      }

      const signer = resolveSigner();

      const feeValue =
        txOptions?.fee !== undefined && txOptions?.fee !== null
          ? BigInt(txOptions.fee)
          : 0n;

      const baseOptions: Record<string, any> = {
        ...txOptions,
        publicKey: currentAccount.publicKey,
        network,
        anchorMode: txOptions.anchorMode ?? AnchorMode.Any,
        postConditionMode: txOptions.postConditionMode ?? PostConditionMode.Allow,
      };

      const contractCallOptions: Record<string, any> = {
        ...baseOptions,
        fee: feeValue,
      };

      if (txOptions.nonce !== undefined && txOptions.nonce !== null) {
        contractCallOptions.nonce = typeof txOptions.nonce === "bigint"
          ? txOptions.nonce
          : BigInt(txOptions.nonce);
      }

      console.debug("[Turnkey] Preparing contract call", {
        walletAccountId: currentAccount.walletAccountId,
        stacksAddress: currentAccount.stacksAddress,
        fee: contractCallOptions.fee,
        nonce: contractCallOptions.nonce ?? "auto",
        functionName: contractCallOptions.functionName,
      });

      const unsignedTx = await makeUnsignedContractCall(contractCallOptions as any);

      const signedTx = await signStacksTransactionWithTurnkey(unsignedTx, currentAccount, signer);

      const broadcastResponse = await broadcastTransaction(signedTx, network);
      toast({
        title: "Transaction submitted",
        description: `Transaction ID: ${broadcastResponse.txid}`,
      });
      return broadcastResponse.txid;
    },
    [resolveSigner, currentAccount],
  );

  const sendSTX = useCallback(
    async (recipient: string, amount: bigint, memo?: string) => {
      if (!currentAccount) {
        throw new Error("Turnkey wallet not connected");
      }

      const signer = resolveSigner();

      const transferOptions: Record<string, any> = {
        recipient,
        amount,
        memo,
        network,
        publicKey: currentAccount.publicKey,
        anchorMode: AnchorMode.Any,
      };

      const unsignedTx = await makeUnsignedSTXTokenTransfer(transferOptions as any);

      const signedTx = await signStacksTransactionWithTurnkey(unsignedTx, currentAccount, signer);

      const broadcastResponse = await broadcastTransaction(signedTx, network);
      toast({
        title: "Transfer submitted",
        description: `Transaction ID: ${broadcastResponse.txid}`,
      });
      return broadcastResponse.txid;
    },
    [resolveSigner, currentAccount],
  );

  const getSBTCBalance = useCallback(async () => {
    if (!currentAccount) {
      return "0.00000000";
    }
    try {
      return await fetchSbtcBalance(currentAccount.stacksAddress);
    } catch (error) {
      console.error("sBTC balance fetch failed:", error);
      return "0.00000000";
    }
  }, [currentAccount]);

  const contextValue = useMemo<TurnkeyWalletContextShape>(
    () => ({
      isConnected,
      isInitializing,
      accounts,
      currentAccount,
      address: primaryAddress,
      balance,
      network,
      createWallet,
      importWallet,
      connectWithPasskey,
      disconnectWallet,
      switchWallet,
      signAndBroadcastTransaction,
      sendSTX,
      getSBTCBalance,
      isAuthenticated,
      hasAccount,
    }),
    [
      accounts,
      balance,
      connectWithPasskey,
      createWallet,
      importWallet,
      currentAccount,
      disconnectWallet,
      getSBTCBalance,
      hasAccount,
      isAuthenticated,
      isConnected,
      isInitializing,
      primaryAddress,
      sendSTX,
      signAndBroadcastTransaction,
      switchWallet,
    ],
  );

  return (
    <TurnkeyWalletContext.Provider value={contextValue}>
      {children}
    </TurnkeyWalletContext.Provider>
  );
};

export function useTurnkeyWallet() {
  const context = useContext(TurnkeyWalletContext);
  if (!context) {
    throw new Error("useTurnkeyWallet must be used within TurnkeyWalletProvider");
  }
  return context;
}
