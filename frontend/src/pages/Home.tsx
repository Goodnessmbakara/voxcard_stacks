import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Layout from '@/components/layout/Footer';
import { TurnkeyTest } from '@/components/TurnkeyTest';

const Home = () => {
  return (
    <>
      {/* Hero Section */}
      <section className="py-20 md:py-32 bg-gradient-to-b from-vox-primary/5 to-white">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 md:pr-12">
              <motion.h1 
                className="text-4xl md:text-6xl font-heading font-bold mb-6 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <span className="gradient-text">Transparent</span> &<br />
                <span className="gradient-text">Secure</span> Community<br />
                Savings on Stacks
              </motion.h1>
              
              <motion.p 
                className="text-lg text-vox-secondary/80 mb-8 font-sans"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                VoxCard reimagines traditional Ajo/Esusu savings circles with blockchain technology,
                enabling secure pooling of funds without middlemen or escrow risk.
              </motion.p>
              
              <motion.div 
                className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Link to="/groups/create">
                  <Button size="lg" className="gradient-bg text-white w-full sm:w-auto hover:opacity-90 transition-opacity">
                    Start a Savings Circle
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/groups">
                  <Button size="lg" variant="outline" className="border-vox-primary text-vox-primary hover:bg-vox-primary/10 w-full sm:w-auto">
                    Browse Groups
                  </Button>
                </Link>
              </motion.div>
            </div>
            
            <motion.div 
              className="md:w-1/2 mt-12 md:mt-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div className="relative">
                <div className="absolute -top-6 -left-6 w-64 h-64 bg-vox-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-vox-secondary/20 rounded-full blur-3xl"></div>
                
                <div className="relative bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-heading font-bold text-xl">Community Savings</h3>
                      <p className="text-sm text-vox-secondary/60">8 of 12 participants</p>
                    </div>
                    <div className="bg-vox-primary/10 rounded-full px-3 py-1">
                      <span className="text-xs font-medium text-vox-primary">Active</span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="p-3 bg-vox-secondary/5 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-sm text-vox-secondary/70">Monthly contribution</p>
                        <p className="font-semibold text-vox-secondary">100 STX</p>
                      </div>
                      <div className="bg-vox-primary/10 text-vox-primary text-xs font-medium px-2 py-1 rounded">
                        Paid
                      </div>
                    </div>
                    
                    <div className="p-3 bg-vox-secondary/5 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-sm text-vox-secondary/70">Your turn</p>
                        <p className="font-semibold text-vox-secondary">Month 4 of 12</p>
                      </div>
                      <div className="bg-vox-accent/10 text-vox-accent text-xs font-medium px-2 py-1 rounded">
                        Upcoming
                      </div>
                    </div>
                    
                    <div className="p-3 bg-vox-secondary/5 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="text-sm text-vox-secondary/70">Total pool</p>
                        <p className="font-semibold text-vox-secondary">1,200 STX</p>
                      </div>
                      <div className="text-xs font-medium">
                        <span className="text-vox-primary">↑ 9.8%</span> this month
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative py-20 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-vox-primary/5 via-vox-accent/5 to-vox-secondary/5">
          {/* Floating geometric shapes with custom animations */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-vox-primary/10 rounded-full animate-float"></div>
          <div className="absolute top-32 right-20 w-16 h-16 bg-vox-accent/10 rounded-lg rotate-45 animate-drift"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-vox-secondary/10 rounded-full animate-ping"></div>
          <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-vox-primary/15 rounded-lg animate-float" style={{animationDelay: '2s'}}></div>
          <div className="absolute bottom-32 right-10 w-24 h-24 bg-vox-accent/5 rounded-full animate-drift" style={{animationDelay: '1s'}}></div>
          
          {/* Additional floating elements */}
          <div className="absolute top-1/3 left-1/3 w-6 h-6 bg-vox-primary/8 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/3 right-1/4 w-10 h-10 bg-vox-accent/8 rounded-lg animate-bounce" style={{animationDelay: '3s'}}></div>
          
          {/* Subtle grid pattern with shimmer effect */}
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full animate-shimmer" style={{
              backgroundImage: `
                linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
              `,
              backgroundSize: '50px 50px'
            }}></div>
          </div>
          
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-white/10"></div>
        </div>
        
        {/* Content */}
        <div className="container relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 bg-gradient-to-r from-vox-primary to-vox-accent bg-clip-text text-transparent">
                How VoxCard Works
              </h2>
              <p className="text-lg text-vox-secondary/80 font-sans">
                VoxCard leverages Stacks' smart contracts to create transparent, secure, and flexible
                community savings without middlemen or escrow risk.
              </p>
            </motion.div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div 
              className="p-8 border border-white/20 rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-vox-primary to-vox-primary/70 flex items-center justify-center mb-6 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="text-2xl font-heading font-bold mb-3 text-vox-primary">Community-Driven</h3>
              <p className="text-vox-secondary/80 font-sans leading-relaxed">
                Join existing groups or create your own. Members vote on new participants to maintain 
                community trust and security.
              </p>
            </motion.div>
            
            <motion.div 
              className="p-8 border border-white/20 rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-vox-accent to-vox-accent/70 flex items-center justify-center mb-6 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h3 className="text-2xl font-heading font-bold mb-3 text-vox-accent">Flexible Payments</h3>
              <p className="text-vox-secondary/80 font-sans leading-relaxed">
                Make partial payments, pay ahead, or adjust your schedule. Our system accommodates 
                your unique financial situation.
              </p>
            </motion.div>
            
            <motion.div 
              className="p-8 border border-white/20 rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-vox-secondary to-vox-secondary/70 flex items-center justify-center mb-6 shadow-lg">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h3 className="text-2xl font-heading font-bold mb-3 text-vox-secondary">Trust Scoring</h3>
              <p className="text-vox-secondary/80 font-sans leading-relaxed">
                On-chain trust scoring system ensures fairness and optimizes payout order based 
                on participant reliability.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-vox-primary to-vox-secondary text-white">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">Ready to Start Saving Together?</h2>
            <p className="text-xl mb-8 opacity-90 font-sans">
              Join a community of savers and create your financial future together.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/groups/create">
                <Button size="lg" variant="secondary" className="bg-white text-vox-primary hover:bg-gray-100 w-full sm:w-auto font-sans">
                  Create a Group
                </Button>
              </Link>
              <Link to="/groups">
                <Button size="lg" className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white/20 w-full sm:w-auto font-sans">
                  Browse Groups
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Turnkey Test Component - Remove after testing */}
      <section className="py-12 bg-gray-50">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-8">Turnkey Embedded Wallet Test</h2>
          <TurnkeyTest />
        </div>
      </section>
    </>
  );
};

export default Home;
