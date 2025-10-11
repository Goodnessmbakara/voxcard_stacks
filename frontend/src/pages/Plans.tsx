import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Footer';
import PlanCard from '@/components/shared/PlanCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Plus, Users, Shield, Zap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useContract } from '@/context/StacksContractProvider';
import { useTurnkeyWallet } from '@/context/TurnkeyWalletProvider';
import { Plan } from '@/types/utils';

const Plans = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10; // adjust as needed

  const { getPaginatedPlans } = useContract();
  const {
    isConnected,
    address,
    connectWithPasskey,
    isAuthenticated,
    hasAccount,
    createWallet,
  } = useTurnkeyWallet();
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      // Don't fetch if wallet is not connected
      if (!isConnected || !address) {
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching plans for page:', page, 'pageSize:', pageSize);
        const { plans: paginatedPlans, totalCount } = await getPaginatedPlans(page, pageSize);
        
        console.log('Fetched plans:', paginatedPlans);
        console.log('Total count:', totalCount);

        setPlans(paginatedPlans);
        setError(null); // Clear any previous errors
        // Optionally store totalCount for pagination UI
      } catch (err) {
        console.error('Error fetching groups:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch groups');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [page, isConnected, address]); // re-run if page, connection, or address changes

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && plan.is_active) ||
      (statusFilter === 'inactive' && !plan.is_active);

    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <div className="relative container py-8">
        {/* UI remains the same... */}

        {/* Header Section with Search, Filter, and Create Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          {/* Search and Filter Row */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 sticky top-16 z-20 backdrop-blur rounded-xl p-4 md:p-0 shadow md:shadow-none">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-3 top-3 text-vox-secondary/40" />
              <Input
                placeholder="Search groups by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-sans border-vox-primary focus:ring-vox-primary rounded-lg"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-[180px] font-sans border-vox-primary focus:ring-vox-primary rounded-lg">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Create Group Button - Always visible */}
          <motion.div 
            className="flex justify-end mb-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/groups/create">
              <motion.div
                className="inline-flex items-center gap-2 px-6 py-3 bg-vox-primary text-white font-semibold rounded-lg hover:bg-vox-primary/90 transition-colors shadow-md"
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus size={20} />
                {filteredPlans.length > 0 ? "Create New Group" : "Create Your First Group"}
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {!isConnected ? (
            <motion.div 
              className="text-center py-16"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-vox-primary/10 flex items-center justify-center">
                  <Users size={40} className="text-vox-primary" />
                </div>
                <h2 className="text-2xl font-heading font-bold text-gray-800 mb-4">
                  {isAuthenticated ? "Create Your Wallet" : "Connect Your Wallet"}
                </h2>
                <p className="text-gray-600 mb-6">
                  {isAuthenticated
                    ? "You are signed in. Create an embedded wallet to browse and join savings groups."
                    : "Please sign in to browse groups and participate."}
                </p>
                <div className="flex flex-col gap-3 items-center">
                  {!isAuthenticated && (
                    <Button
                      onClick={() => connectWithPasskey()}
                      className="bg-vox-primary text-white hover:bg-vox-primary/90"
                    >
                      Sign In with Turnkey
                    </Button>
                  )}
                  {isAuthenticated && !hasAccount && (
                    <Button
                      onClick={async () => {
                        try {
                          setIsCreatingWallet(true);
                          await createWallet();
                        } finally {
                          setIsCreatingWallet(false);
                        }
                      }}
                      disabled={isCreatingWallet}
                      className="bg-vox-primary text-white hover:bg-vox-primary/90"
                    >
                      {isCreatingWallet ? "Creating Wallet..." : "Create Embedded Wallet"}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : loading ? (
            <motion.div className="text-center py-16">Loading groups...</motion.div>
          ) : error ? (
            <motion.div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Groups</h3>
                <p className="text-gray-600">{error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mt-4 bg-vox-primary text-white hover:bg-vox-primary/90"
                >
                  Try Again
                </Button>
              </div>
            </motion.div>
          ) : filteredPlans.length > 0 ? (
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              className="text-center py-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="max-w-4xl mx-auto">
                {/* Empty State Hero with Immediate CTA */}
                <motion.div 
                  className="mb-8"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-vox-primary/10 flex items-center justify-center">
                    <Users size={40} className="text-vox-primary" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-gray-800 mb-3">
                    No groups found
                  </h2>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Be the first to start a savings group in your community! 
                    Create a group and invite others to save together.
                  </p>
                  
                  {/* Immediate CTA Button - Above the fold */}
                  <motion.div 
                    className="mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Link to="/groups/create">
                      <motion.div
                        className="inline-flex items-center gap-3 px-8 py-4 bg-vox-primary text-white font-semibold rounded-xl hover:bg-vox-primary/90 transition-colors shadow-lg"
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Plus size={24} />
                        Create Your First Group
                        <ArrowRight size={20} />
                      </motion.div>
                    </Link>
                    <p className="text-sm text-gray-500 mt-3">
                      It only takes 2 minutes to get started
                    </p>
                  </motion.div>
                </motion.div>

                {/* Features Section - Below the main CTA */}
                <motion.div 
                  className="bg-gradient-to-br from-vox-primary/5 to-vox-accent/5 rounded-2xl p-6 md:p-8 border border-vox-primary/10"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.6 }}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-heading font-bold text-gray-800 mb-3">
                      Why Choose VoxCard?
                    </h3>
                    <p className="text-gray-600">
                      Experience the future of community savings
                    </p>
                  </div>

                  {/* Compact Features Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      {
                        icon: <Shield size={24} className="text-vox-primary" />,
                        title: "Secure & Transparent",
                        description: "Built on Stacks blockchain for complete transparency"
                      },
                      {
                        icon: <Users size={24} className="text-vox-primary" />,
                        title: "Community Driven",
                        description: "Connect with trusted members in your network"
                      },
                      {
                        icon: <Zap size={24} className="text-vox-primary" />,
                        title: "Smart Automation",
                        description: "Automated payouts and smart contract execution"
                      }
                    ].map((feature, idx) => (
                      <motion.div 
                        key={feature.title}
                        className="text-center p-4 bg-white rounded-lg shadow-sm"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + idx * 0.1 }}
                        whileHover={{ scale: 1.02, y: -2 }}
                      >
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-vox-primary/10 flex items-center justify-center">
                          {feature.icon}
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-2 text-sm">{feature.title}</h4>
                        <p className="text-xs text-gray-600">{feature.description}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button - Always visible */}
        <motion.div
          className="fixed bottom-6 right-6 z-50"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Link to="/groups/create">
            <motion.div
              className="w-16 h-16 bg-vox-primary rounded-full shadow-xl flex items-center justify-center text-white hover:bg-vox-primary/90 transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <Plus size={28} />
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </>
  );
};

export default Plans;
