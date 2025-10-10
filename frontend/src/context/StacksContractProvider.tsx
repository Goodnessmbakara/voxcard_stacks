import { createContext, useContext, ReactNode } from "react";
import { useTurnkey } from "@turnkey/react-wallet-kit";
import {
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  bufferCVFromString,
  uintCV,
  stringUtf8CV,
  stringAsciiCV,
  principalCV,
  boolCV,
  callReadOnlyFunction,
  cvToJSON,
} from "@stacks/transactions";
import { StacksTestnet, StacksMainnet } from "@stacks/network";
import { toast } from "@/hooks/use-toast";

// Contract configuration
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "";
const contractName = import.meta.env.VITE_CONTRACT_NAME || "voxcard-savings";

const isMainnet = import.meta.env.VITE_STACKS_NETWORK === "mainnet";
const network = isMainnet ? new StacksMainnet() : new StacksTestnet();

export interface CreatePlanInput {
  name: string;
  description: string;
  total_participants: number;
  contribution_amount: string;
  frequency: string;
  duration_months: number;
  trust_score_required: number;
  allow_partial: boolean;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  creator: string;
  total_participants: number;
  contribution_amount: string;
  frequency: string;
  duration_months: number;
  trust_score_required: number;
  allow_partial: boolean;
  participants: string[];
  join_requests: string[];
  created_at: number;
}

export interface ParticipantCycleStatus {
  contributed_this_cycle: string;
  remaining_this_cycle: string;
  is_recipient_this_cycle: boolean;
}

interface ContractContextProps {
  address: string;
  account?: string;
  balance?: string;
  createPlan: (plan: CreatePlanInput) => Promise<any>;
  getPlansByCreator: (creator: string) => Promise<{ plans: Plan[] }>;
  getPlanById: (planId: number) => Promise<{ plan: Plan | null }>;
  getPaginatedPlans: (page: number, pageSize: number) => Promise<{ plans: Plan[]; totalCount: number }>;
  requestJoinPlan: (planId: number) => Promise<any>;
  approveJoinRequest: (planId: number, requester: string) => Promise<any>;
  denyJoinRequest: (planId: number, requester: string) => Promise<any>;
  getJoinRequests: (planId: number) => Promise<{ requests: string[] }>;
  contribute: (planId: number, amountMicroSTX: string) => Promise<any>;
  getParticipantCycleStatus: (planId: number, participant: string) => Promise<ParticipantCycleStatus>;
  getTrustScore: (sender: string) => Promise<number>;
}

const ContractContext = createContext<ContractContextProps | null>(null);

export const StacksContractProvider = ({ children }: { children: ReactNode }) => {
  const { address, authState } = useTurnkey();
  const isConnected = authState === 'AUTHENTICATED';

  // Helper function to make contract calls with embedded wallet
  const makeContractCallWithEmbeddedWallet = async (txOptions: any) => {
    if (!isConnected || !address) {
      throw new Error("Embedded wallet not connected");
    }

    try {
      // Build the transaction
      const transaction = await makeContractCall({
        ...txOptions,
        network,
        anchorMode: txOptions.anchorMode || AnchorMode.Any,
        postConditionMode: txOptions.postConditionMode || PostConditionMode.Allow,
      });

      // For now, we'll use the traditional broadcast method
      // In a full implementation, this would use Turnkey's signing
      const result = await broadcastTransaction(transaction, network);
      
      toast({
        title: "Transaction Submitted",
        description: `Transaction ID: ${result.txid}`,
      });

      return result;
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

  const createPlan = async (plan: CreatePlanInput): Promise<any> => {
    if (!isConnected || !address) {
      throw new Error("Embedded wallet not connected");
    }

    // Convert STX to microSTX (1 STX = 1,000,000 microSTX)
    const contributionAmountMicroSTX = Math.floor(parseFloat(plan.contribution_amount) * 1_000_000);

    const txOptions = {
      contractAddress,
      contractName,
      functionName: "create-plan",
      functionArgs: [
        stringUtf8CV(plan.name),
        stringUtf8CV(plan.description),
        uintCV(plan.total_participants),
        uintCV(contributionAmountMicroSTX),
        stringAsciiCV(plan.frequency),
        uintCV(plan.duration_months),
        uintCV(plan.trust_score_required),
        boolCV(plan.allow_partial),
        stringAsciiCV("STX"), // Default asset type
      ],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    return await makeContractCallWithEmbeddedWallet(txOptions);
  };

  const getPlansByCreator = async (creator: string) => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-plans-by-creator",
        functionArgs: [principalCV(creator)],
        network,
        senderAddress: address!,
      });

      const plans = cvToJSON(result).value;
      return { plans };
    } catch (error) {
      console.error("Error fetching plans by creator:", error);
      return { plans: [] };
    }
  };

  const getPlanById = async (planId: number) => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-plan",
        functionArgs: [uintCV(planId)],
        network,
        senderAddress: address!,
      });

      const response = cvToJSON(result);
      console.log('getPlanById response for plan', planId, ':', response);
      
      // The contract returns (ok (map-get? plans { plan-id: plan-id }))
      // So we need to check if the result is okay and has a value
      if (response.okay && response.value) {
        return { plan: response.value };
      } else {
        console.log('Plan not found or no value for plan', planId);
        return { plan: null };
      }
    } catch (error) {
      console.error("Error fetching plan:", error);
      return { plan: null };
    }
  };

  const getPaginatedPlans = async (page: number, pageSize: number) => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    try {
      // First get the total count
      const countResult = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-plan-count",
        functionArgs: [],
        network,
        senderAddress: address!,
      });

      const countResponse = cvToJSON(countResult);
      console.log('Plan count response:', countResponse);
      
      const totalCount = countResponse.okay ? Number(countResponse.value) : 0;
      console.log('Total plan count:', totalCount);

      const start = (page - 1) * pageSize + 1;
      const end = Math.min(start + pageSize - 1, totalCount);

      const plans = [];
      for (let i = start; i <= end; i++) {
        const planRes = await getPlanById(i);
        if (planRes?.plan) {
          plans.push(planRes.plan);
        }
      }

      console.log('Final plans array:', plans);
      return { plans, totalCount };
    } catch (error) {
      console.error("Error fetching paginated plans:", error);
      return { plans: [], totalCount: 0 };
    }
  };

  const requestJoinPlan = async (planId: number): Promise<any> => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    const txOptions = {
      contractAddress,
      contractName,
      functionName: "request-to-join-plan",
      functionArgs: [uintCV(planId)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    return await makeContractCallWithEmbeddedWallet(txOptions);
  };

  const approveJoinRequest = async (planId: number, requester: string): Promise<any> => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    const txOptions = {
      contractAddress,
      contractName,
      functionName: "approve-join-request",
      functionArgs: [uintCV(planId), principalCV(requester)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    return await makeContractCallWithEmbeddedWallet(txOptions);
  };

  const denyJoinRequest = async (planId: number, requester: string): Promise<any> => {
    if (!isConnected || !address) {
      throw new Error("Wallet not connected");
    }

    const txOptions = {
      contractAddress,
      contractName,
      functionName: "deny-join-request",
      functionArgs: [uintCV(planId), principalCV(requester)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    return await makeContractCallWithEmbeddedWallet(txOptions);
  };

  const getJoinRequests = async (planId: number): Promise<{ requests: string[] }> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-join-requests",
        functionArgs: [uintCV(planId)],
        network,
        senderAddress: address!,
      });

      const requests = cvToJSON(result).value;
      return { requests };
    } catch (error) {
      console.error("Error fetching join requests:", error);
      return { requests: [] };
    }
  };

  const contribute = async (planId: number, amountMicroSTX: string) => {
    if (!isConnected || !address) {
      throw new Error("Embedded wallet not connected");
    }

    const txOptions = {
      contractAddress,
      contractName,
      functionName: "contribute",
      functionArgs: [uintCV(planId), uintCV(amountMicroSTX)],
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      postConditions: [],
    };

    return await makeContractCallWithEmbeddedWallet(txOptions);
  };

  const getParticipantCycleStatus = async (planId: number, participant: string): Promise<ParticipantCycleStatus> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-participant-cycle-status",
        functionArgs: [uintCV(planId), principalCV(participant)],
        network,
        senderAddress: address!,
      });

      const status = cvToJSON(result).value;
      return status;
    } catch (error) {
      console.error("Error fetching participant cycle status:", error);
      return {
        contributed_this_cycle: "0",
        remaining_this_cycle: "0",
        is_recipient_this_cycle: false,
      };
    }
  };

  const getTrustScore = async (sender: string): Promise<number> => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-trust-score",
        functionArgs: [principalCV(sender)],
        network,
        senderAddress: address!,
      });

      const score = Number(cvToJSON(result).value);
      return score;
    } catch (error) {
      console.error("Error fetching trust score:", error);
      return 0;
    }
  };

  return (
    <ContractContext.Provider
      value={{
        address: contractAddress,
        account: address || undefined,
        balance: balance || undefined,
        createPlan,
        getPlansByCreator,
        getPlanById,
        getPaginatedPlans,
        requestJoinPlan,
        approveJoinRequest,
        denyJoinRequest,
        getJoinRequests,
        contribute,
        getParticipantCycleStatus,
        getTrustScore,
      }}
    >
      {children}
    </ContractContext.Provider>
  );
};

export const useContract = () => {
  const ctx = useContext(ContractContext);
  if (!ctx) {
    throw new Error("useContract must be used within StacksContractProvider");
  }
  return ctx;
};

