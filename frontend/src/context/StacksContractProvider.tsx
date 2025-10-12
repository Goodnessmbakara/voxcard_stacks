import { createContext, useContext, ReactNode } from "react";
import {
  AnchorMode,
  PostConditionMode,
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
import { useTurnkeyWallet } from "./TurnkeyWalletProvider";

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
  getPlansByCreator: (creator: string) => Promise<Plan[]>;
  getPlanById: (planId: number) => Promise<Plan | null>;
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

const MICROSTX_PER_STX = 1_000_000;

function clarityToNative(cv: any): any {
  if (cv === null || cv === undefined) {
    return cv;
  }
  if (typeof cv !== "object" || !("type" in cv)) {
    return cv;
  }

  switch (cv.type) {
    case "uint":
    case "int":
      return Number(cv.value);
    case "bool":
      return Boolean(cv.value);
    case "string-utf8":
    case "string-ascii":
    case "principal":
      return cv.value;
    case "buffer":
      return cv.value;
    case "list":
      return (cv.value ?? []).map(clarityToNative);
    case "optional":
      return cv.value == null ? null : clarityToNative(cv.value);
    case "tuple": {
      const obj: Record<string, unknown> = {};
      Object.entries(cv.value ?? {}).forEach(([key, val]) => {
        obj[key] = clarityToNative(val);
      });
      return obj;
    }
    case "response":
      return {
        ok: cv.success,
        value: cv.success ? clarityToNative(cv.value) : null,
        error: cv.success ? null : clarityToNative(cv.value),
      };
    default:
      return cv.value ?? cv;
  }
}

function ensureArray<T = any>(value: T | T[] | Record<string, T> | null | undefined): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === null || value === undefined) {
    return [];
  }
  if (typeof value === "object") {
    return Object.values(value);
  }
  return [value];
}

function normalizePlan(rawPlan: any, planId?: number): Plan | null {
  if (!rawPlan || typeof rawPlan !== "object") {
    console.log('🔧 DEBUG - normalizePlan: Invalid rawPlan:', rawPlan);
    return null;
  }

  console.log('🔧 DEBUG - normalizePlan: Processing plan data:', rawPlan);
  console.log('🔧 DEBUG - normalizePlan: Available keys:', Object.keys(rawPlan));

  const getField = (keys: string[], fallback?: any) => {
    for (const key of keys) {
      if (rawPlan[key] !== undefined) {
        console.log(`🔧 DEBUG - normalizePlan: Found field '${key}':`, rawPlan[key]);
        return rawPlan[key];
      }
    }
    console.log(`🔧 DEBUG - normalizePlan: No field found for keys:`, keys);
    return fallback;
  };

  // Use the planId parameter if provided, otherwise try to extract from data
  const idValue = planId || getField(["plan-id", "plan_id", "id"]);
  if (idValue === undefined || idValue === null) {
    console.log('🔧 DEBUG - normalizePlan: No valid ID found');
    return null;
  }

  console.log('🔧 DEBUG - normalizePlan: Using plan ID:', idValue);

  const contributionMicro =
    getField(["contribution-amount", "contribution_amount", "contributionAmount"], 0) ?? 0;

  const contributionStx =
    typeof contributionMicro === "number"
      ? (contributionMicro / MICROSTX_PER_STX).toString()
      : String(contributionMicro ?? "0");

  const participants = ensureArray(getField(["participants"], [])).map((participant) =>
    String(participant),
  );
  const joinRequests = ensureArray(getField(["join-requests", "join_requests"], [])).map(
    (request) => String(request),
  );

  const createdAtRaw = getField(["created-at", "created_at", "createdAt"], 0);

  const normalizedPlan = {
    id: String(idValue),
    name: getField(["name", "plan-name", "plan_name"], ""),
    description: getField(["description", "plan-description", "plan_description"], ""),
    creator: getField(["creator", "creator-address", "creator_address"], ""),
    total_participants: Number(
      getField(["total-participants", "total_participants", "participantCount"], 0),
    ),
    contribution_amount: contributionStx,
    frequency: getField(["frequency"], ""),
    duration_months: Number(
      getField(["duration-months", "duration_months", "durationMonths"], 0),
    ),
    trust_score_required: Number(
      getField(["trust-score-required", "trust_score_required", "trustScoreRequired"], 0),
    ),
    allow_partial: Boolean(
      getField(["allow-partial", "allow_partial", "allowPartial"], false),
    ),
    participants,
    join_requests: joinRequests,
    created_at: Number(createdAtRaw ?? 0),
  };

  console.log('🔧 DEBUG - normalizePlan: Final normalized plan:', normalizedPlan);
  return normalizedPlan;
}

export const StacksContractProvider = ({ children }: { children: ReactNode }) => {
  const {
    isConnected,
    address,
    balance,
    signAndBroadcastTransaction,
  } = useTurnkeyWallet();

  // Rate limiting protection
  const apiCallDelays = new Map<string, number>();
  const RATE_LIMIT_DELAY = 2000; // 2 seconds between calls

  const rateLimitedCall = async (key: string, fn: () => Promise<any>) => {
    const lastCall = apiCallDelays.get(key) || 0;
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall < RATE_LIMIT_DELAY) {
      const delay = RATE_LIMIT_DELAY - timeSinceLastCall;
      console.log(`Rate limiting: waiting ${delay}ms before ${key}`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    apiCallDelays.set(key, Date.now());
    return fn();
  };

  // Helper function to make contract calls with embedded wallet
  const makeContractCallWithEmbeddedWallet = async (txOptions: any) => {
    if (!isConnected || !address) {
      throw new Error("Embedded wallet not connected");
    }

    try {
      console.log('🚀 Broadcasting transaction with options:', txOptions);
      const txid = await signAndBroadcastTransaction({
        ...txOptions,
        network,
        anchorMode: txOptions.anchorMode || AnchorMode.Any,
        postConditionMode: txOptions.postConditionMode || PostConditionMode.Allow,
      });
      console.log('✅ Transaction broadcasted successfully:', txid);
      
      // Wait a moment and check transaction status
      setTimeout(async () => {
        try {
          const txStatus = await fetch(`https://api.testnet.hiro.so/v2/transactions/${txid}`);
          if (txStatus.ok) {
            const txData = await txStatus.json();
            console.log('📊 Transaction status:', txData);
          } else {
            console.log(`⚠️ Transaction status check failed: ${txStatus.status} ${txStatus.statusText}`);
          }
        } catch (statusError) {
          console.log('⚠️ Could not fetch transaction status:', statusError);
        }
      }, 5000);
      
      return { txid };
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

    console.log('🚀 Creating plan with data:', plan);

    // Convert STX to microSTX (1 STX = 1,000,000 microSTX)
    const contributionAmountMicroSTX = Math.floor(parseFloat(plan.contribution_amount) * 1_000_000);
    
    console.log('📊 Converted contribution amount:', {
      original: plan.contribution_amount,
      microSTX: contributionAmountMicroSTX,
      meetsMinimum: contributionAmountMicroSTX >= 100 // min-contribution-amount is u100
    });

    // Validate inputs before sending
    if (!plan.name || plan.name.trim() === '') {
      throw new Error("Plan name is required");
    }
    if (!plan.description || plan.description.trim() === '') {
      throw new Error("Plan description is required");
    }
    if (plan.total_participants < 2) {
      throw new Error("Plan must have at least 2 participants");
    }
    if (contributionAmountMicroSTX < 100) {
      throw new Error("Contribution amount must be at least 0.0001 STX");
    }
    if (!plan.frequency || !['Daily', 'Weekly', 'Biweekly', 'Monthly'].includes(plan.frequency)) {
      throw new Error("Invalid frequency");
    }
    if (plan.duration_months < 1 || plan.duration_months > 24) {
      throw new Error("Duration must be between 1 and 24 months");
    }

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
      fee: 1000000n, // Increased fee for better transaction processing
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
    };

    console.log('📝 Transaction options:', txOptions);

    try {
      const result = await makeContractCallWithEmbeddedWallet(txOptions);
      console.log('✅ Plan creation transaction result:', result);
      return result;
    } catch (error: any) {
      console.error('❌ Plan creation failed:', error);
      throw error;
    }
  };

  const getPlansByCreator = async (creator: string) => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      return await rateLimitedCall('getPlansByCreator', async () => {
        const result = await callReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: "get-plans-by-creator",
          functionArgs: [principalCV(creator)],
          network,
          senderAddress: contractAddress,
        });

        const native = clarityToNative(cvToJSON(result));
        const planIds = native && typeof native === "object" && "ok" in native
          ? native.ok
            ? native.value
            : []
          : native;

        console.log('🔍 DEBUG - Raw planIds from contract:', planIds);
        console.log('🔍 DEBUG - planIds type:', typeof planIds);
        console.log('🔍 DEBUG - planIds array:', Array.isArray(planIds));

        // Convert plan IDs to actual plan objects
        const plans: Plan[] = [];
        for (const planId of ensureArray(planIds)) {
          try {
            // Ensure planId is a valid integer
            const planIdNum = parseInt(String(planId), 10);
            if (isNaN(planIdNum) || planIdNum <= 0) {
              console.warn(`Invalid plan ID: ${planId}`);
              continue;
            }
            
            const plan = await getPlanById(planIdNum);
            if (plan) {
              plans.push(plan);
            }
          } catch (error) {
            console.warn(`Failed to fetch plan ${planId}:`, error);
          }
        }

        return plans;
      });
    } catch (error) {
      console.error("Error fetching plans by creator:", error);
      return [];
    }
  };

  const getPlanById = async (planId: number) => {
    if (!isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      console.log(`🔍 DEBUG - Fetching plan ID: ${planId}`);
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-plan",
        functionArgs: [uintCV(planId)],
        network,
        senderAddress: contractAddress,
      });

      console.log(`🔍 DEBUG - Raw plan result for ID ${planId}:`, result);
      const native = clarityToNative(cvToJSON(result));
      console.log(`🔍 DEBUG - Native plan result for ID ${planId}:`, native);
      
      // Handle the Response type from contract
      let payload = null;
      if (native && typeof native === "object" && "ok" in native) {
        if (native.ok && native.value !== null && native.value !== undefined) {
          // Check if the value is wrapped in another optional
          if (native.value && typeof native.value === "object" && "value" in native.value) {
            payload = native.value.value;
          } else {
            payload = native.value;
          }
        }
      } else if (native && native !== null) {
        payload = native;
      }

      console.log(`🔍 DEBUG - Plan payload for ID ${planId}:`, payload);
      
      // Check if payload is null/undefined (plan doesn't exist)
      if (payload === null || payload === undefined) {
        console.log(`🔍 DEBUG - Plan ${planId} does not exist`);
        return null;
      }
      
      const plan = normalizePlan(payload, planId);
      console.log(`🔍 DEBUG - Normalized plan for ID ${planId}:`, plan);
      return plan ?? null;
    } catch (error) {
      console.error(`❌ Failed to fetch plan ID ${planId}`, error);
      return null;
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
        senderAddress: contractAddress,
      });

      const countNative = clarityToNative(cvToJSON(countResult));
      console.log('🔍 DEBUG - Contract address:', contractAddress);
      console.log('🔍 DEBUG - Contract name:', contractName);
      console.log('🔍 DEBUG - Raw count result:', countResult);
      console.log('🔍 DEBUG - Count native:', countNative);
      
      // Handle different response formats
      let totalCount = 0;
      if (typeof countNative === "number") {
        totalCount = countNative;
      } else if (countNative && typeof countNative === "object") {
        // Handle case where clarityToNative returns {type: 'uint', value: '3'}
        if (typeof countNative.value === "string" || typeof countNative.value === "number") {
          totalCount = Number(countNative.value);
        } else if (typeof countNative.value === "number") {
          totalCount = countNative.value;
        }
      }
      
      console.log('🔍 DEBUG - Final total count:', totalCount);

      // If count is 0, return empty results immediately
      if (totalCount === 0) {
        console.log('🔍 DEBUG - No plans found, returning empty array');
        return { plans: [], totalCount: 0 };
      }

      const start = (page - 1) * pageSize + 1;
      const end = Math.min(start + pageSize - 1, totalCount);
      
      console.log(`🔍 DEBUG - Fetching plans from ID ${start} to ${end}`);

      const plans = [];
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 5; // Stop if we get 5 consecutive failures
      
      for (let i = start; i <= end; i++) {
        console.log(`🔍 DEBUG - Attempting to fetch plan ID ${i}`);
        const plan = await getPlanById(i);
        if (plan) {
          console.log(`✅ Successfully fetched plan ID ${i}:`, plan);
          plans.push(plan);
          consecutiveFailures = 0; // Reset failure counter
        } else {
          console.log(`❌ Failed to fetch plan ID ${i}`);
          consecutiveFailures++;
          
          // If we get too many consecutive failures, stop fetching
          if (consecutiveFailures >= maxConsecutiveFailures) {
            console.log(`⚠️ Stopping after ${consecutiveFailures} consecutive failures`);
            break;
          }
        }
      }
      
      console.log(`🔍 DEBUG - Final plans array:`, plans);
      console.log(`🔍 DEBUG - Found ${plans.length} actual plans out of ${totalCount} expected`);

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
        senderAddress: contractAddress,
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
        senderAddress: contractAddress,
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
      return await rateLimitedCall('getTrustScore', async () => {
        const result = await callReadOnlyFunction({
          contractAddress,
          contractName,
          functionName: "get-trust-score",
          functionArgs: [principalCV(sender)],
          network,
          senderAddress: contractAddress,
        });

        const native = clarityToNative(cvToJSON(result));
        const score = native && typeof native === "object" && "ok" in native
          ? native.ok
            ? Number(native.value)
            : 50 // Default trust score for new users
          : 50; // Default trust score if result is invalid

        return score;
      });
    } catch (error) {
      console.error("Error fetching trust score:", error);
      return 50; // Default trust score for new users
    }
  };

  return (
    <ContractContext.Provider
      value={{
        address: address || "",
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
