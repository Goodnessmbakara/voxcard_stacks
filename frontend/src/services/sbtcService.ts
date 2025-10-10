/**
 * sBTC Service
 * Handles all sBTC-related operations including balance queries, transfers, and bridge interactions
 */

import {
  makeContractCall,
  makeSTXTokenTransfer,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  bufferCV,
  uintCV,
  principalCV,
  noneCV,
  someCV,
} from "@stacks/transactions";
import { StacksTestnet, StacksMainnet } from "@stacks/network";

// Network configuration
const isMainnet = import.meta.env.VITE_STACKS_NETWORK === "mainnet";
const network = isMainnet ? new StacksMainnet() : new StacksTestnet();

// sBTC Contract addresses (Testnet)
const SBTC_TOKEN_CONTRACT = import.meta.env.VITE_SBTC_TOKEN_CONTRACT ||
  "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-token";

const SBTC_REGISTRY_CONTRACT = import.meta.env.VITE_SBTC_REGISTRY_CONTRACT ||
  "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-registry";

const SBTC_DEPOSIT_CONTRACT = import.meta.env.VITE_SBTC_DEPOSIT_CONTRACT ||
  "SM3VDXK3WZZSA84XXFKAFAF15NNZX32CTSG82JFQ4.sbtc-deposit";

// Parse contract address
const [sbtcTokenAddr, sbtcTokenName] = SBTC_TOKEN_CONTRACT.split(".");
const [sbtcRegistryAddr, sbtcRegistryName] = SBTC_REGISTRY_CONTRACT.split(".");

export interface SBTCBalance {
  balance: string; // in sBTC (not satoshis)
  balanceSatoshis: bigint; // in satoshis
}

export interface SBTCTransferOptions {
  recipient: string;
  amount: bigint; // in satoshis
  memo?: string;
  senderKey: string;
}

export interface SBTCWithdrawalOptions {
  amount: bigint; // in satoshis
  btcAddress: string;
  maxFee: bigint; // max fee for withdrawal
  senderKey: string;
}

export class SBTCService {
  /**
   * Get sBTC balance for an address
   */
  static async getSBTCBalance(address: string): Promise<SBTCBalance> {
    try {
      const apiUrl = isMainnet
        ? `https://api.mainnet.hiro.so/v2/contracts/call-read/${sbtcTokenAddr}/${sbtcTokenName}/get-balance`
        : `https://api.testnet.hiro.so/v2/contracts/call-read/${sbtcTokenAddr}/${sbtcTokenName}/get-balance`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: address,
          arguments: [
            `0x${Buffer.from(address, 'utf8').toString("hex")}`
          ],
        }),
      });

      const data = await response.json();

      if (data.okay && data.result) {
        // Parse the Clarity uint result
        const balanceSatoshis = BigInt(data.result.replace("u", ""));
        const balance = (Number(balanceSatoshis) / 100_000_000).toFixed(8);

        return {
          balance,
          balanceSatoshis,
        };
      }

      return {
        balance: "0.00000000",
        balanceSatoshis: BigInt(0),
      };
    } catch (error) {
      console.error("Error fetching sBTC balance:", error);
      return {
        balance: "0.00000000",
        balanceSatoshis: BigInt(0),
      };
    }
  }

  /**
   * Transfer sBTC to another address
   */
  static async transferSBTC(options: SBTCTransferOptions): Promise<string> {
    const { recipient, amount, memo, senderKey } = options;

    try {
      const txOptions = {
        contractAddress: sbtcTokenAddr,
        contractName: sbtcTokenName,
        functionName: "transfer",
        functionArgs: [
          uintCV(amount),
          principalCV(senderKey), // sender
          principalCV(recipient),
          memo ? someCV(bufferCV(Buffer.from(memo, "utf8"))) : noneCV(),
        ],
        senderKey,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny, // Strict post-conditions for token transfers
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, network);

      return broadcastResponse.txid;
    } catch (error) {
      console.error("Error transferring sBTC:", error);
      throw error;
    }
  }

  /**
   * Initiate sBTC withdrawal to BTC
   * This burns sBTC and requests BTC to be sent to the specified address
   */
  static async withdrawSBTCForBTC(options: SBTCWithdrawalOptions): Promise<string> {
    const { amount, btcAddress, maxFee, senderKey } = options;

    try {
      // Parse BTC address to get version and hashbytes
      // Note: This is a simplified version - production code should properly parse BTC addresses
      const btcAddressBuffer = Buffer.from(btcAddress, "utf8");
      const version = Buffer.from([0x00]); // P2PKH version byte
      const hashBytes = btcAddressBuffer.subarray(0, 32); // First 32 bytes

      const txOptions = {
        contractAddress: sbtcRegistryAddr,
        contractName: sbtcRegistryName,
        functionName: "create-withdrawal-request",
        functionArgs: [
          uintCV(amount),
          uintCV(maxFee),
          {
            version: bufferCV(version),
            hashbytes: bufferCV(hashBytes),
          },
        ],
        senderKey,
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
      };

      const transaction = await makeContractCall(txOptions);
      const broadcastResponse = await broadcastTransaction(transaction, network);

      return broadcastResponse.txid;
    } catch (error) {
      console.error("Error initiating sBTC withdrawal:", error);
      throw error;
    }
  }

  /**
   * Get the sBTC bridge URL for deposits
   */
  static getBridgeURL(): string {
    return "https://sbtc.stacks.co";
  }

  /**
   * Check if an address has sufficient sBTC balance
   */
  static async hasSufficientBalance(address: string, requiredAmount: bigint): Promise<boolean> {
    const balance = await this.getSBTCBalance(address);
    return balance.balanceSatoshis >= requiredAmount;
  }

  /**
   * Convert STX amount to satoshis
   */
  static toSatoshis(amount: number): bigint {
    return BigInt(Math.floor(amount * 100_000_000));
  }

  /**
   * Convert satoshis to sBTC
   */
  static fromSatoshis(satoshis: bigint): string {
    return (Number(satoshis) / 100_000_000).toFixed(8);
  }

  /**
   * Query withdrawal status
   */
  static async getWithdrawalStatus(requestId: number): Promise<any> {
    try {
      const apiUrl = isMainnet
        ? `https://api.mainnet.hiro.so/v2/contracts/call-read/${sbtcRegistryAddr}/${sbtcRegistryName}/get-withdrawal-request`
        : `https://api.testnet.hiro.so/v2/contracts/call-read/${sbtcRegistryAddr}/${sbtcRegistryName}/get-withdrawal-request`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: sbtcRegistryAddr,
          arguments: [uintCV(requestId).serializeToHex()],
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching withdrawal status:", error);
      throw error;
    }
  }

  /**
   * Query deposit status
   */
  static async getDepositStatus(txid: string, voutIndex: number): Promise<any> {
    try {
      const apiUrl = isMainnet
        ? `https://api.mainnet.hiro.so/v2/contracts/call-read/${sbtcRegistryAddr}/${sbtcRegistryName}/get-completed-deposit`
        : `https://api.testnet.hiro.so/v2/contracts/call-read/${sbtcRegistryAddr}/${sbtcRegistryName}/get-completed-deposit`;

      const txidBuffer = Buffer.from(txid, "hex");

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: sbtcRegistryAddr,
          arguments: [
            bufferCV(txidBuffer).serializeToHex(),
            uintCV(voutIndex).serializeToHex(),
          ],
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching deposit status:", error);
      throw error;
    }
  }

  /**
   * Monitor a transaction until it's confirmed
   */
  static async waitForConfirmation(
    txid: string,
    maxAttempts: number = 30,
    delayMs: number = 5000
  ): Promise<boolean> {
    const apiUrl = isMainnet
      ? `https://api.mainnet.hiro.so/extended/v1/tx/${txid}`
      : `https://api.testnet.hiro.so/extended/v1/tx/${txid}`;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.tx_status === "success") {
          return true;
        } else if (data.tx_status === "abort_by_response" || data.tx_status === "abort_by_post_condition") {
          throw new Error(`Transaction failed: ${data.tx_status}`);
        }

        // Wait before next attempt
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } catch (error) {
        console.error(`Attempt ${attempt + 1} failed:`, error);
      }
    }

    throw new Error("Transaction confirmation timeout");
  }
}

export default SBTCService;

