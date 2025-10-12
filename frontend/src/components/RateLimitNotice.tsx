import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Clock } from "lucide-react";

export const RateLimitNotice = () => {
  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="font-medium">Rate Limited</span>
        </div>
        <p className="mt-1 text-sm">
          Turnkey API is currently rate limiting requests. Please wait a moment before trying again.
          This usually resolves within 1-2 minutes.
        </p>
      </AlertDescription>
    </Alert>
  );
};
