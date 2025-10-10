import { useTurnkey, AuthState } from "@turnkey/react-wallet-kit";
import { motion } from "framer-motion";

export function TurnkeyTest() {
  const { 
    handleLogin, 
    authState, 
    user, 
    wallets, 
    createWallet, 
    handleImportWallet, 
    handleExportWallet 
  } = useTurnkey();

  return (
    <motion.div 
      className="p-8 bg-white rounded-2xl shadow-xl max-w-lg mx-auto border border-gray-100"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header with VoxCard branding */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-vox-primary to-vox-primary-light rounded-2xl mx-auto mb-4 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">V</span>
        </div>
        <h2 className="text-2xl font-bold gradient-text mb-2">Embedded Wallet Test</h2>
        <p className="text-gray-600 text-sm">Experience VoxCard's secure wallet integration</p>
      </div>
      
      {/* Authentication Status */}
      <motion.div 
        className="mb-6 p-4 rounded-xl border-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{
          background: authState === AuthState.Authenticated 
            ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(16, 185, 129, 0.1))'
            : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))',
          borderColor: authState === AuthState.Authenticated ? '#22c55e' : '#ef4444'
        }}
      >
        {authState === AuthState.Authenticated ? (
          <div className="text-center">
            <div className="w-12 h-12 bg-green-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-white text-xl">✓</span>
            </div>
            <p className="text-green-700 font-semibold mb-1">Authenticated</p>
            <p className="text-green-600 text-sm">Welcome, {user?.userName || 'User'}!</p>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-white text-xl">✗</span>
            </div>
            <p className="text-red-700 font-semibold">Not authenticated</p>
            <p className="text-red-600 text-sm">Click below to get started</p>
          </div>
        )}
      </motion.div>

      {/* Authentication Button */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button 
          onClick={handleLogin}
          className="w-full gradient-bg text-white py-4 px-6 rounded-xl font-semibold text-lg hover:opacity-90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          🚀 Login / Sign Up
        </button>
      </motion.div>

      {/* Wallet Management */}
      {authState === AuthState.Authenticated && (
        <motion.div 
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="text-center mb-4">
            <h3 className="font-bold text-lg text-gray-800 mb-2">Wallet Management</h3>
            <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-full">
              <span className="text-sm font-medium text-gray-600">
                {wallets?.length || 0} wallet{wallets?.length !== 1 ? 's' : ''} connected
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={createWallet}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              ✨ Create New Wallet
            </button>
            
            <button 
              onClick={handleImportWallet}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              📥 Import Wallet
            </button>
            
            {wallets && wallets.length > 0 && (
              <button 
                onClick={() => handleExportWallet({ walletId: wallets[0].walletId })}
                className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                📤 Export First Wallet
              </button>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
