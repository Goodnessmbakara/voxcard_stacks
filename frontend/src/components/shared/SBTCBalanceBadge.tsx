import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, ExternalLink, Bitcoin } from "lucide-react";
import { SBTCService } from "@/services/sbtcService";
import { useTurnkeyWallet } from "@/context/TurnkeyWalletProvider";
import { useStacksWallet } from "@/context/StacksWalletProvider";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SBTCBalanceBadgeProps {
  showBridgeLink?: boolean;
  showRefresh?: boolean;
  className?: string;
}

export const SBTCBalanceBadge = ({
  showBridgeLink = true,
  showRefresh = true,
  className = "",
}: SBTCBalanceBadgeProps) => {
  const [balance, setBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Try Turnkey wallet first, fall back to Stacks wallet
  const turnkeyWallet = useTurnkeyWallet();
  const stacksWallet = useStacksWallet();

  const address = turnkeyWallet?.isConnected 
    ? turnkeyWallet.address 
    : stacksWallet?.isConnected 
    ? stacksWallet.address 
    : null;

  const fetchBalance = async () => {
    if (!address) {
      setBalance(null);
      return;
    }

    try {
      setIsLoading(true);
      const result = await SBTCService.getSBTCBalance(address);
      setBalance(result.balance);
    } catch (error) {
      console.error("Error fetching sBTC balance:", error);
      setBalance("0.00000000");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchBalance();
    setIsRefreshing(false);
  };

  const openBridge = () => {
    window.open(SBTCService.getBridgeURL(), "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    fetchBalance();
  }, [address]);

  if (!address) {
    return null;
  }

  if (isLoading && balance === null) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Skeleton className="h-6 w-32" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={`flex items-center gap-2 ${className}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              className="flex items-center gap-1.5 px-3 py-1.5 cursor-help"
            >
              <Bitcoin className="h-4 w-4 text-orange-500" />
              <span className="font-mono text-sm">
                {balance || "0.00000000"} sBTC
              </span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>sBTC Balance (Bitcoin-backed asset)</p>
            <p className="text-xs text-muted-foreground mt-1">
              1 sBTC = 1 BTC
            </p>
          </TooltipContent>
        </Tooltip>

        {showRefresh && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        )}

        {showBridgeLink && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={openBridge}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Bridge</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Convert BTC to sBTC or vice versa</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

export default SBTCBalanceBadge;

