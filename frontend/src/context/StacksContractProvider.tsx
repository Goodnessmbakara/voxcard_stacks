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

function normalizePlan(rawPlan: any): Plan | null {
  if (!rawPlan || typeof rawPlan !== "object") {
    return null;
  }

  const getField = (keys: string[], fallback?: any) => {
    for (const key of keys) {
      if (rawPlan[key] !== undefined) {
        return rawPlan[key];
      }
    }
    return fallback;
  };

  const idValue = getField(["plan-id", "plan_id", "id"]);
  if (idValue === undefined || idValue === null) {
    return null;
  }

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

  return {
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
}

export const StacksContractProvider = ({ children }: { children: ReactNode }) => {
  const {
    isConnected,
    address,
    balance,
    signAndBroadcastTransaction,
  } = useTurnkeyWallet();

  // Helper function to make contract calls with embedded wallet
  const makeContractCallWithEmbeddedWallet = async (txOptions: any) => {
    if (!isConnected || !address) {
      throw new Error("Embedded wallet not connected");
    }

    try {
      const txid = await signAndBroadcastTransaction({
        ...txOptions,
        network,
        anchorMode: txOptions.anchorMode || AnchorMode.Any,
        postConditionMode: txOptions.postConditionMode || PostConditionMode.Allow,
      });
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

      const native = clarityToNative(cvToJSON(result));
      const payload =
        native && typeof native === "object" && "ok" in native
          ? native.ok
            ? native.value
            : []
          : native;

      const plansSource =
        payload && typeof payload === "object" && "plans" in payload ? payload.plans : payload;

      const plans = ensureArray(plansSource)
        .map((plan) => normalizePlan(plan))
        .filter(Boolean) as Plan[];

      return plans;
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
      const result = await callReadOnlyFunction({
        contractAddress,
        contractName,
        functionName: "get-plan",
        functionArgs: [uintCV(planId)],
        network,
        senderAddress: address!,
      });

      const native = clarityToNative(cvToJSON(result));
      const payload =
        native && typeof native === "object" && "ok" in native
          ? native.ok
            ? native.value
            : null
          : native;

      const plan = normalizePlan(payload);
      return plan ?? null;
    } catch (error) {
      console.error("Error fetching plan:", error);
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
        senderAddress: address!,
      });

      const countNative = clarityToNative(cvToJSON(countResult));
      const totalCount =
        typeof countNative === "number"
          ? countNative
          : typeof countNative?.value === "number"
          ? countNative.value
          : 0;

      const start = (page - 1) * pageSize + 1;
      const end = Math.min(start + pageSize - 1, totalCount);

      const plans = [];
      for (let i = start; i <= end; i++) {
        const plan = await getPlanById(i);
        if (plan) {
          plans.push(plan);
        }
      }

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
