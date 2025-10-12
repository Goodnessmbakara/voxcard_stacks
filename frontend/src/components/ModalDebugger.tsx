import { useEffect, useState } from 'react';

interface ModalDebuggerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ModalDebugger({ isOpen, onClose }: ModalDebuggerProps) {
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      const info = [
        `Modal opened at: ${new Date().toISOString()}`,
        `Turnkey modals in DOM: ${document.querySelectorAll('[data-testid="turnkey-modal"], .turnkey-modal, [role="dialog"]').length}`,
        `Custom styled modals: ${document.querySelectorAll('.turnkey-modal').length}`,
        `Active intervals: ${(window as any).__intervalCount || 0}`,
        `Active observers: ${(window as any).__observerCount || 0}`,
      ];
      setDebugInfo(info);
      
      // Log to console for debugging
      console.log('🔍 MODAL DEBUG INFO:', info);
    } else {
      setDebugInfo([]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Modal Debug Info</h3>
        <div className="space-y-2 mb-4">
          {debugInfo.map((info, index) => (
            <div key={index} className="text-sm font-mono bg-gray-100 p-2 rounded">
              {info}
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Close Debug Info
        </button>
      </div>
    </div>
  );
}
