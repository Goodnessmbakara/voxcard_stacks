// components/modals/ContributeModal.tsx

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plan } from "@/types/utils";
import { Coins } from "lucide-react";
import { useTurnkeyWallet } from "@/context/TurnkeyWalletProvider";
import { useContract } from "@/context/StacksContractProvider";
import type { ParticipantCycleStatus } from "@/types/utils";
import { TransactionSuccessModal } from "@/components/modals/TransactionSuccessModal";

interface ContributeModalProps {
  plan: Plan;
  cycleStatus?: ParticipantCycleStatus;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ContributeModal = ({ plan, cycleStatus, open, onClose, onSuccess }: ContributeModalProps) => {
  const { toast } = useToast();
  const { address } = useTurnkeyWallet();
  const { contribute } = useContract();

  const defaultAmount = String(cycleStatus?.remaining_this_cycle);
  const [amountMicroSTX, setAmountMicroSTX] = useState(defaultAmount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  useEffect(() => {
    if (open) setAmountMicroSTX(defaultAmount);
  }, [open, defaultAmount]);

  const handleContribute = async () => {
    if (!address) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet",
        variant: "destructive",
      });
      return;
    }

    if (!/^\d+$/.test(amountMicroSTX)) {
      toast({
        title: "Invalid amount",
        description: "Amount must be a whole number of microSTX (no decimals).",
        variant: "destructive",
      });
      return;
    }

    if (!plan.allow_partial && amountMicroSTX !== String(plan.contribution_amount)) {
      toast({
        title: "Full amount required",
        description: `This group requires exactly ${plan.contribution_amount} microSTX.`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await contribute(Number(plan.id), amountMicroSTX);
      
      if (res && res.txid) {
        setTransactionId(res.txid);
        onClose(); // Close the contribute modal first
        setShowSuccessModal(true); // Then show success modal
        onSuccess(); // Trigger parent refresh
        
        toast({
          title: "Contribution submitted",
          description: "Your contribution has been broadcasted to the blockchain.",
        });
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err?.message || "Failed to submit contribution.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
  };

	const handleChange = (e) => {
		const value = e.target.value;

		// Allow only digits or empty string
		if (/^\d*$/.test(value)) {
			const numericValue = parseInt(value, 10);
			// Check if the value is within the range
			if (value === '' || (numericValue >= 1 && numericValue <= Number(cycleStatus?.remaining_this_cycle))) {
				setAmountMicroSTX(value);
			} else if (numericValue < 1) {
				setAmountMicroSTX('1'); // Reset to minimum
			} else if (numericValue > Number(cycleStatus?.remaining_this_cycle)) {
				setAmountMicroSTX(cycleStatus?.remaining_this_cycle); // Reset to maximum
			}
		}
	};


  return (
    <>
      <TransactionSuccessModal
        open={showSuccessModal}
        onClose={handleSuccessModalClose}
        txid={transactionId}
        title="Contribution Successful!"
        description={`Your contribution of ${amountMicroSTX} microSTX to "${plan.name}" has been submitted to the blockchain.`}
      />
      
      <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Make Contribution</DialogTitle>
          <DialogDescription>
            Contribute to “{plan.name}”
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (microSTX)</Label>
			{plan.allow_partial ? (
				<>
					<Input
						id="amount"
						type="text"
						inputMode="numeric"
						value={amountMicroSTX}
						onChange={(e) => handleChange(e)}
						placeholder={`e.g. ${cycleStatus?.remaining_this_cycle}`}
					/>
					<p className="text-sm text-gray-500">
						Partial payments allowed. Enter whole-number microSTX.
					</p>
				</>
				
			) : (
				<>
				<p className="font-bold ">{plan.contribution_amount}</p>
					<p className="text-sm text-gray-500">
						Full payment required: {plan.contribution_amount} microSTX
					</p>
				</>
				
			)}
          </div>

          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Coins className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Contribution Info
                </h3>
                <div className="mt-2 text-sm text-green-700 space-y-1">
                  <p>• Expected: {plan.contribution_amount} microSTX</p>
                  <p>• Frequency: {plan.frequency.toLowerCase()}</p>
                  {plan.allow_partial && <>
					<p>Partial payments allowed</p>
					<p>Contributed: {cycleStatus?.contributed_this_cycle} microSTX</p>
					<p>Left: {cycleStatus?.remaining_this_cycle} microSTX</p>
				  </>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleContribute}
            disabled={isSubmitting}
            className="gradient-bg text-white"
          >
            {isSubmitting ? "Processing..." : "Make Contribution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default ContributeModal;
