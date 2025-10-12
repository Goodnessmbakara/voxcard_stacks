import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ExternalLink, Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface TransactionSuccessModalProps {
  open: boolean;
  onClose: () => void;
  txid: string;
  title?: string;
  description?: string;
}

export function TransactionSuccessModal({
  open,
  onClose,
  txid,
  title = "Transaction Successful!",
  description = "Your transaction has been broadcasted to the blockchain.",
}: TransactionSuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const explorerUrl = `https://explorer.hiro.so/txid/${txid}?chain=testnet`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(txid);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Transaction ID copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatTxId = (txId: string) => {
    if (txId.length <= 16) return txId;
    return `${txId.slice(0, 8)}...${txId.slice(-8)}`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl font-heading">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Transaction ID */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Transaction ID
            </label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <code className="flex-1 text-sm font-mono text-gray-900 break-all">
                {formatTxId(txid)}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="shrink-0"
                title="Copy transaction ID"
              >
                <Copy className={`h-4 w-4 ${copied ? "text-green-600" : ""}`} />
              </Button>
            </div>
          </div>

          {/* Status Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>⏳ Pending Confirmation</strong>
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Your transaction is being processed. It typically takes 10-20
              minutes (1-2 blocks) to confirm.
            </p>
          </div>

          {/* Full Transaction ID (expandable) */}
          <details className="group">
            <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 flex items-center gap-1">
              <span>View full transaction ID</span>
              <span className="group-open:rotate-180 transition-transform">
                ▼
              </span>
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
              <code className="text-xs font-mono text-gray-700 break-all">
                {txid}
              </code>
            </div>
          </details>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(explorerUrl, "_blank")}
            className="w-full sm:w-auto"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View on Explorer
          </Button>
          <Button
            onClick={onClose}
            className="gradient-bg text-white w-full sm:w-auto"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

