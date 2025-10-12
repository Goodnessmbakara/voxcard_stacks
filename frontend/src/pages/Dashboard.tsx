import { useState, useEffect, useCallback, useRef } from 'react';
import { mockPayouts, defaultUser } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTurnkeyWallet } from '@/context/TurnkeyWalletProvider';
import PlanCard from '@/components/shared/PlanCard';
import TrustScoreBadge from '@/components/shared/TrustScoreBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { Calendar, Clock, Plus, Wallet, Copy, LogOut, RefreshCw, ExternalLink, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { shortenAddress } from '@/services/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from "@/components/ui/button";
import { useContract } from "../context/StacksContractProvider";
import { Plan } from '../types/utils';


const explorerUrl = (address: string) => `https://explorer.hiro.so/address/${address}?chain=testnet`;

interface ManageWalletModalProps {
  open: boolean;
  onClose: () => void;
  address: string;
  hasAccount: boolean;
  onCreateWallet: () => Promise<void>;
  onImportWallet: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  isCreating: boolean;
}

const ManageWalletModal = ({
  open,
  onClose,
  address,
  hasAccount,
  onCreateWallet,
  onImportWallet,
  onDisconnect,
  isCreating,
}: ManageWalletModalProps) => {
  const { balance } = useContract();
  const [copied, setCopied] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const walletAddress = address;
	
  const handleCopy = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await onDisconnect();
      onClose();
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleCreateWallet = async () => {
    await onCreateWallet();
  };

  const handleImportWallet = async () => {
    await onImportWallet();
  };

  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Account</DialogTitle>
          <DialogDescription>
            View and manage your connected Stacks Account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            {hasAccount ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">Balance</div>
                  <div className="font-semibold">{balance} STX</div>
                </div>
                <div className="flex items-center gap-2 bg-gray-50 rounded px-3 py-2">
                  <span className="font-mono text-xs break-all">
                    {walletAddress ? shortenAddress(walletAddress) : "No Address Connected"}
                  </span>
                  <Button onClick={handleCopy} className="ml-1">
                    <Copy size={16} className={copied ? "text-vox-accent" : ""} />
                  </Button>
                  {copied && <span className="text-xs text-vox-accent">Copied!</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <a
                    href={walletAddress ? explorerUrl(walletAddress) : "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-vox-primary hover:underline text-sm"
                  >
                    <ExternalLink size={16} /> View on Hiro Explorer
                  </a>
                  <Button
                    variant="outline"
                    className="w-full flex items-center gap-2 border-red-500 text-red-600 hover:bg-red-50"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                  >
                    <LogOut size={16} /> {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  You are signed in but do not have an embedded wallet yet. Create one to start
                  interacting with VoxCard on Stacks.
                </p>
                <Button
                  onClick={handleCreateWallet}
                  className="w-full gradient-bg text-white hover:opacity-90 transition-opacity"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <RefreshCw size={16} className="mr-2 animate-spin" />
                      Creating Wallet...
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="mr-2" />
                      Create Embedded Wallet
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleImportWallet}
                  className="w-full"
                >
                  Import Existing Wallet
                </Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onClose} className="w-full mt-2">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const Dashboard = () => {
	const { account, getPlansByCreator, getTrustScore } = useContract();
	const [userPlans, setUserPlans] = useState<Plan[]>([]);
  const {
    address,
    balance: userBalance,
    isConnected,
    connectWithPasskey,
    createWallet,
    importWallet,
    hasAccount,
    isAuthenticated,
    disconnectWallet,
  } = useTurnkeyWallet();
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);


  const [activeTab, setActiveTab] = useState('overview');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const modalTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [trustScore, setTrustScore] = useState(50);

  const handleCreateWallet = useCallback(async () => {
    try {
      setIsCreatingWallet(true);
      await createWallet();
    } finally {
      setIsCreatingWallet(false);
    }
  }, [createWallet]);

  // Mock data usage
  const user = defaultUser;
  const userAddress = address ?? "";

  useEffect(() => {
    const fetchPlans = async () => {
      if (!account) {
        setUserPlans([]);
        return;
      }

      try {
        const plans = await getPlansByCreator(account);
        setUserPlans(plans);

        const score = await getTrustScore(account);
        setTrustScore(Number(score));
      } catch (error) {
        console.error("Failed to load user plans:", error);
        setUserPlans([]);
      }
    };

    fetchPlans();
  }, [account, getPlansByCreator, getTrustScore]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (modalTimeoutRef.current) {
        clearTimeout(modalTimeoutRef.current);
      }
    };
  }, []);


  // Upcoming payout (mock)
  const upcomingPayout = mockPayouts.find(
    (payout) => payout.recipientId === user.id && payout.status === 'Scheduled'
  );

  return (
    <>
      <ManageWalletModal
        open={showWalletModal}
        onClose={() => {
          try {
            // Clear the timeout if modal is closed normally
            if (modalTimeoutRef.current) {
              clearTimeout(modalTimeoutRef.current);
              modalTimeoutRef.current = null;
            }
            setIsModalLoading(false);
            setShowWalletModal(false);
          } catch (error) {
            console.error('Error closing wallet modal:', error);
          }
        }}
        address={userAddress}
        hasAccount={hasAccount}
        onCreateWallet={handleCreateWallet}
        onImportWallet={importWallet}
        onDisconnect={disconnectWallet}
        isCreating={isCreatingWallet}
      />
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-heading font-bold mb-2 text-vox-secondary">Dashboard</h1>
            <p className="text-vox-secondary/70 font-sans">Manage your savings group and track your progress.</p>
          </div>
          {isConnected && (
            <Link to="/groups/create" className="mt-4 md:mt-0">
              <Button className="gradient-bg text-white font-sans hover:opacity-90 transition-opacity">
                <Plus size={16} className="mr-2" />
                Create Group
              </Button>
            </Link>
          )}
        </div>

        <AnimatePresence mode="wait">
          {!isConnected ? (
            <motion.div
              key="connect-wallet"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center min-h-[60vh]"
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="w-full max-w-xs"
              >
                <div className="w-24 h-24 rounded-full bg-vox-primary/10 flex items-center justify-center mb-6 mx-auto">
                  <Wallet size={48} className="text-vox-primary" />
                </div>
                <h2 className="text-xl font-heading font-bold text-center text-vox-secondary mb-2">
                  {isAuthenticated ? "Create Your Wallet" : "Sign In to Account"}
                </h2>
                <p className="text-center text-vox-secondary/70 mb-6 font-sans">
                  {isAuthenticated
                    ? "You are authenticated. Create an embedded wallet to start managing your savings groups."
                    : "Please sign in to view your dashboard and manage your group."}
                </p>
                <div className="space-y-3">
                  {!isAuthenticated && (
                    <Button
                      className="w-full gradient-bg text-white font-sans hover:opacity-90 transition-opacity"
                      onClick={() => connectWithPasskey()}
                    >
                      Sign In with Turnkey
                    </Button>
                  )}
                  {isAuthenticated && !hasAccount && (
                    <Button
                      className="w-full gradient-bg text-white font-sans hover:opacity-90 transition-opacity"
                      onClick={handleCreateWallet}
                      disabled={isCreatingWallet}
                    >
                      {isCreatingWallet ? (
                        <>
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                          Creating Wallet...
                        </>
                      ) : (
                        <>
                          <Plus size={16} className="mr-2" />
                          Create Embedded Wallet
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard-content"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                  {/* User Profile Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="font-heading text-vox-primary">Your Profile</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-vox-secondary/60 font-sans">Account Address</p>
                          <p className="font-mono text-sm font-medium text-vox-secondary">
                            {shortenAddress(userAddress)}
                          </p>
                        </div>
                        <TrustScoreBadge score={trustScore} />
                      </div>
                      <div>
                        <p className="text-sm text-vox-secondary/60 font-sans mb-1">Trust Score Progress</p>
                        <Progress value={trustScore} className="h-2 bg-vox-primary/10" />
                      </div>
                      <div className="pt-2">
                        <Button
                          className="w-full font-sans border-vox-primary text-vox-primary hover:bg-vox-primary/10"
                          onClick={() => {
                            try {
                              setIsModalLoading(true);
                              setShowWalletModal(true);
                              
                              // Set a timeout to prevent modal from staying open indefinitely
                              modalTimeoutRef.current = setTimeout(() => {
                                console.warn('Modal timeout - forcing close');
                                setIsModalLoading(false);
                                setShowWalletModal(false);
                              }, 10000); // 10 second timeout
                            } catch (error) {
                              console.error('Error opening wallet modal:', error);
                              setIsModalLoading(false);
                            }
                          }}
                          disabled={isModalLoading}
                        >
                          <Wallet size={16} className="mr-2" />
                          {isModalLoading ? 'Opening...' : 'Manage Account'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Activity Summary */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="font-heading text-vox-primary">Activity Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-vox-secondary/60 font-sans">Active Groups</p>
                          <p className="text-xl font-bold text-vox-secondary">{userPlans.length}</p>
                        </div>
                        <div>
                          <p className="text-sm text-vox-secondary/60 font-sans">Total Contributed</p>
                          <p className="text-xl font-bold text-vox-secondary">350 STX</p>
                        </div>
                      </div>
                      {upcomingPayout && (
                        <div className="bg-vox-accent/10 border border-vox-accent rounded-lg p-4">
                          <div className="flex items-center text-vox-accent mb-2">
                            <Calendar size={16} className="mr-2" />
                            <p className="text-sm font-medium">Upcoming Payout</p>
                          </div>
                          <p className="font-bold text-lg text-vox-accent">{upcomingPayout.amount} STX</p>
                          <div className="flex items-center text-sm text-vox-secondary/60 mt-1">
                            <Clock size={14} className="mr-1" />
                            <p>{upcomingPayout.scheduledDate.toLocaleDateString()}</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-2">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="mb-6">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="groups">Your Groups</TabsTrigger>
                      <TabsTrigger value="contributions">Contributions</TabsTrigger>
                    </TabsList>

					<TabsContent value="overview">
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4 }}
						>
							{userPlans.filter((plan) => plan.is_active).length > 0 ? (
							<div className="space-y-6">
								<h2 className="text-xl font-heading font-semibold text-vox-secondary">
								Your Active Groups
								</h2>
								{userPlans
								.filter((plan) => plan.is_active)
								.map((plan) => (
									<PlanCard key={plan.id} plan={plan} />
								))}
							</div>
							) : (
							<Card>
								<CardHeader>
								<CardTitle className="font-heading text-vox-primary">
									Welcome to VoxCard!
								</CardTitle>
								<CardDescription className="text-vox-secondary/70 font-sans">
									You haven't joined any active savings group yet. Get started by creating or joining a group.
								</CardDescription>
								</CardHeader>
								<CardContent className="flex flex-col items-center py-6">
								<div className="w-24 h-24 rounded-full bg-vox-primary/10 flex items-center justify-center mb-4">
									<Wallet size={36} className="text-vox-primary" />
								</div>
								<p className="text-center text-vox-secondary/70 mb-6 max-w-md font-sans">
									Join a community savings group to start pooling resources with others,
									or create your own group and invite friends and family.
								</p>
								</CardContent>
								<CardFooter className="flex flex-col sm:flex-row gap-3">
								<Link to="/groups" className="w-full sm:w-auto">
									<Button className="w-full font-sans border-vox-primary text-vox-primary hover:bg-vox-primary/10">
									Browse Groups
									</Button>
								</Link>
								<Link to="/groups/create" className="w-full sm:w-auto">
									<Button className="w-full gradient-bg text-white font-sans hover:opacity-90 transition-opacity">
									Create a Group
									</Button>
								</Link>
								</CardFooter>
							</Card>
							)}
						</motion.div>
					</TabsContent>


                    <TabsContent value="groups">
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                        <h2 className="text-xl font-heading font-semibold text-vox-secondary">All Your Groups</h2>
                        {userPlans.length > 0 ? (
                          userPlans.map((p) => (
                            <PlanCard key={p.id} plan={p} />
                          ))
                        ) : (
                          <div className="text-center py-12">
                            <p className="text-vox-secondary/70 mb-4 font-sans">You haven't joined any group yet.</p>
                            <Link to="/groups">
                              <Button className="gradient-bg text-white font-sans hover:opacity-90 transition-opacity">Browse Groups</Button>
                            </Link>
                          </div>
                        )}
                      </motion.div>
                    </TabsContent>

                    <TabsContent value="contributions">
                      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                        <h2 className="text-xl font-heading font-semibold text-vox-secondary">Your Recent Contributions</h2>
                        <div className="rounded-lg border overflow-hidden">
                          <div className="grid grid-cols-12 bg-vox-primary/5 p-3 border-b">
                            <div className="col-span-4 font-medium font-sans text-vox-secondary">Group</div>
                            <div className="col-span-3 font-medium font-sans text-vox-secondary">Amount</div>
                            <div className="col-span-3 font-medium font-sans text-vox-secondary">Date</div>
                            <div className="col-span-2 font-medium font-sans text-vox-secondary">Round</div>
                          </div>
                          {/* Mock contributions */}
                          <div className="grid grid-cols-12 p-3 border-b">
                            <div className="col-span-4 font-sans">Community Savings</div>
                            <div className="col-span-3 font-sans">100 STX</div>
                            <div className="col-span-3 font-sans">Apr 15, 2025</div>
                            <div className="col-span-2 font-sans">2 of 12</div>
                          </div>
                          <div className="grid grid-cols-12 p-3 border-b">
                            <div className="col-span-4 font-sans">Emergency Fund</div>
                            <div className="col-span-3 font-sans">75 STX</div>
                            <div className="col-span-3 font-sans">Mar 10, 2025</div>
                            <div className="col-span-2 font-sans">1 of 8</div>
                          </div>
                        </div>
                      </motion.div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Dashboard;
