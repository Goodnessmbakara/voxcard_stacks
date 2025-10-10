# 🚀 VoxCard Deployment Guide

## Quick Deploy Checklist

- [ ] Contracts tested locally
- [ ] Frontend connected to testnet
- [ ] Wallet integration tested
- [ ] Documentation complete
- [ ] Security review done
- [ ] Deployment config ready

---

## Prerequisites

###  Required Tools
```bash
# Clarinet for contract deployment
clarinet --version  # Should be 3.7.0+

# Node.js for frontend
node --version  # Should be 18+

# pnpm for package management
pnpm --version  # Should be 8.15+
```

### Required Accounts
1. **Stacks Testnet Account**
   - Get testnet STX from: https://explorer.hiro.so/sandbox/faucet
   - Need ~50 STX for deployment + testing

2. **Stacks Mainnet Account** (for production)
   - Real STX required for gas fees
   - Keep private keys secure!

---

## Step 1: Test Contracts Locally

### 1.1 Run Contract Tests
```bash
cd voxcard-stacks
clarinet test
```

Expected output:
```
✓ Can create a savings plan
✓ Enforces trust score requirements
✓ Tracks contributions correctly
✓ Handles errors gracefully
...
All tests passed!
```

### 1.2 Interactive Testing
```bash
clarinet console
```

Try these commands:
```clarity
;; Create a plan
(contract-call? .voxcard-savings create-plan 
  u"Test Plan" 
  u"Description"
  u10  ;; participants
  u1000000  ;; 1 STX per contribution
  "Monthly"
  u12  ;; 12 months
  u50  ;; trust score required
  false  ;; no partial payments
)

;; Check the plan
(contract-call? .voxcard-savings get-plan u1)

;; Get your trust score
(contract-call? .voxcard-savings get-trust-score tx-sender)
```

---

## Step 2: Deploy to Testnet

### 2.1 Configure Deployment
```bash
cd voxcard-stacks
clarinet deployments generate --testnet
```

This creates `deployments/testnet.devnet-plan.yaml`

### 2.2 Review Deployment Plan
```yaml
---
id: 0
name: Testnet deployment
network: testnet
stacks-node: "https://api.testnet.hiro.so"
bitcoin-node: "http://blockstack:blockstacksystem@bitcoind.testnet.stacks.co:18332"
plan:
  batches:
    - id: 0
      transactions:
        - contract-publish:
            contract-name: voxcard-savings
            expected-sender: ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM
            cost: 8650
            path: contracts/voxcard-savings.clar
```

### 2.3 Deploy Contract
```bash
clarinet deployments apply -p testnet
```

You'll be prompted to sign with your Stacks wallet.

### 2.4 Verify Deployment
```bash
# Get transaction ID from output
TX_ID="0x..."

# Check on explorer
open "https://explorer.hiro.so/txid/$TX_ID?chain=testnet"
```

Wait ~10 minutes for Bitcoin finality.

### 2.5 Save Contract Address
```bash
# Copy from explorer or deployment output
CONTRACT_ADDRESS="ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM"
CONTRACT_NAME="voxcard-savings"

# Save to file
echo "VITE_CONTRACT_ADDRESS=$CONTRACT_ADDRESS" > ../frontend/.env.testnet
echo "VITE_CONTRACT_NAME=$CONTRACT_NAME" >> ../frontend/.env.testnet
echo "VITE_STACKS_NETWORK=testnet" >> ../frontend/.env.testnet
```

---

## Step 3: Connect Frontend

### 3.1 Update Environment
```bash
cd ../frontend

# Copy testnet config
cp .env.testnet .env

# Install dependencies
pnpm install
```

### 3.2 Update Contract Provider
The contract address is already configured in:
`frontend/src/context/StacksContractProvider.tsx`

Make sure it matches:
```typescript
const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS || "";
const contractName = import.meta.env.VITE_CONTRACT_NAME || "voxcard-savings";
```

### 3.3 Test Frontend Locally
```bash
pnpm dev
```

Open http://localhost:5173 and:
1. Click "Connect Wallet"
2. Connect with Leather or Xverse
3. Try creating a test plan
4. Check transaction on explorer

---

## Step 4: Deploy Frontend

### 4.1 Build for Production
```bash
pnpm build
```

Outputs to `frontend/dist/`

### 4.2 Deploy to Vercel (Recommended)

#### Option A: Vercel CLI
```bash
npm install -g vercel
cd frontend
vercel deploy --prod
```

#### Option B: GitHub Integration
1. Push to GitHub
2. Go to https://vercel.com
3. Import repository
4. Add environment variables:
   - `VITE_CONTRACT_ADDRESS`
   - `VITE_CONTRACT_NAME`
   - `VITE_STACKS_NETWORK`
5. Deploy!

### 4.3 Custom Domain (Optional)
```bash
vercel domains add voxcard.app
```

Follow DNS instructions.

---

## Step 5: Mainnet Deployment (Production)

⚠️ **IMPORTANT**: Only deploy to mainnet after thorough testing!

### 5.1 Final Checklist
- [ ] All tests passing
- [ ] Testnet deployed and tested
- [ ] Security review complete
- [ ] User testing done
- [ ] Backup plan ready
- [ ] Monitoring set up
- [ ] Support channels ready

### 5.2 Get Mainnet STX
You'll need ~100 STX for:
- Contract deployment (~50 STX)
- Initial transactions (~10 STX)
- Buffer for fees (~40 STX)

Purchase from exchanges:
- Coinbase
- Binance
- OKX
- Kraken

### 5.3 Deploy to Mainnet
```bash
cd voxcard-stacks

# Generate mainnet plan
clarinet deployments generate --mainnet

# Review carefully!
cat deployments/mainnet.devnet-plan.yaml

# Deploy (use hardware wallet!)
clarinet deployments apply -p mainnet
```

### 5.4 Update Frontend for Mainnet
```bash
cd frontend

# Create mainnet env
cat > .env.production << EOF
VITE_CONTRACT_ADDRESS=[YOUR_MAINNET_ADDRESS]
VITE_CONTRACT_NAME=voxcard-savings
VITE_STACKS_NETWORK=mainnet
VITE_STACKS_API_URL=https://api.mainnet.hiro.so
EOF

# Build
pnpm build

# Deploy
vercel --prod
```

---

## Step 6: Post-Deployment

### 6.1 Monitoring Setup
```bash
# Set up Hiro monitoring
curl -X POST https://platform.hiro.so/api/webhooks \
  -H "Authorization: Bearer $HIRO_API_KEY" \
  -d '{
    "url": "https://voxcard.app/api/webhooks/contract",
    "events": ["contract_call"]
  }'
```

### 6.2 Analytics
```typescript
// Add to frontend
import Analytics from '@vercel/analytics';

<Analytics />
```

### 6.3 Documentation
Update these URLs:
- [ ] Contract address in README
- [ ] Explorer links
- [ ] API endpoints
- [ ] Support links

### 6.4 Announcement
1. **Twitter**: Announce launch
2. **Discord**: Share with community
3. **Stacks Forum**: Create post
4. **DoraHacks**: Submit project
5. **Product Hunt**: Launch product

---

## Troubleshooting

### Contract Deployment Fails

**Error**: "Insufficient balance"
```bash
# Solution: Get more testnet/mainnet STX
open "https://explorer.hiro.so/sandbox/faucet"
```

**Error**: "Contract already exists"
```bash
# Solution: Change contract name or use new address
# Edit Clarinet.toml
```

**Error**: "Transaction nonce mismatch"
```bash
# Solution: Wait for pending transactions to complete
# Check on explorer
```

### Frontend Connection Issues

**Error**: "Failed to connect wallet"
```bash
# Solution: Check wallet is installed
# Try different browser
# Clear cache and cookies
```

**Error**: "Contract not found"
```bash
# Solution: Verify CONTRACT_ADDRESS in .env
# Make sure contract deployment confirmed
# Check network matches (testnet vs mainnet)
```

**Error**: "Transaction rejected"
```bash
# Solution: Check user has sufficient STX
# Verify contract parameters
# Review error code in console
```

---

## Deployment Costs

### Testnet (Free)
- Contract deployment: 0 STX (testnet tokens)
- Transactions: 0 STX (testnet tokens)
- Frontend hosting: Free (Vercel hobby plan)

### Mainnet (Production)
- Contract deployment: ~50-100 STX (~$50-100 USD)
- Transaction fees: ~0.01-0.1 STX per transaction
- Frontend hosting: Free (Vercel hobby) or $20/month (Pro)
- Domain: ~$10-15/year
- Monitoring: Free (Hiro basic) or $99/month (Pro)

**Total Initial Cost**: ~$60-115 USD  
**Monthly Cost**: ~$20-120 USD

---

## Security Checklist

Before deploying to mainnet:

- [ ] All tests passing
- [ ] No hardcoded secrets
- [ ] Error handling comprehensive
- [ ] Input validation complete
- [ ] Access controls verified
- [ ] Emergency pause tested
- [ ] Upgrade path defined
- [ ] Backup plan ready
- [ ] Insurance considered
- [ ] Legal review done

---

## Support

Need help deploying?

- **Discord**: https://discord.gg/voxcard
- **Telegram**: https://t.me/voxcard
- **Email**: deploy@voxcard.app
- **Docs**: https://docs.voxcard.app/deploy

---

## Next Steps

After successful deployment:

1. **Marketing**
   - Launch announcement
   - Social media campaign
   - Community outreach

2. **User Onboarding**
   - Create tutorial videos
   - Write user guides
   - Host AMAs

3. **Feature Development**
   - Gather user feedback
   - Prioritize improvements
   - Plan sBTC integration

4. **Growth**
   - Partner with communities
   - Expand to new regions
   - Build ecosystem

---

**Ready to deploy? Let's go! 🚀**

*For the Stacks Builders Challenge submission, deploy to testnet and document the process.*

