# VoxCard - Technical Validation Checklist

**Goal:** Deploy and test your smart contract on Stacks testnet in 4-6 hours.

---

## 📋 Prerequisites

### Tools You Need

- [ ] **Clarity Clarity & Cargo Clarinet** installed (check: `clarinet --version`)
- [ ] **Docker** installed (for optimization) (check: `docker --version`)
- [ ] **Node.js & pnpm** installed (check: `node --version`, `pnpm --version`)
- [ ] **Stacks testnet wallet** with test tokens
- [ ] **Git** (check: `git --version`)

### Stacks Wallet Setup

1. **Get Stacks Testnet Wallet:**
   - Visit: https://testnet.stacks.co/
   - Create or connect wallet using @stacks/connect
   - Save your wallet address

2. **Get Testnet Tokens:**
   - Join Stacks Discord: https://discord.gg/stacks
   - Go to #testnet-faucet channel
   - Request tokens: `/faucet <your-stacks-address>`
   - Wait for confirmation (usually instant)

3. **Verify Balance:**
   - Check balance in wallet UI
   - Or query via RPC (see commands below)

---

## 🔧 Environment Setup

### Frontend Environment Variables

Create `/Users/abba/Desktop/voxcard/frontend/.env.local`:

```bash
# Stacks Network Configuration
VITE_RPC_URL=https://api.testnet.hiro.so/
VITE_REST_URL=https://api.testnet.hiro.so/

# Smart Contract Address (will be filled after deployment)
VITE_CONTRACT_ADDRESS=

# Treasury Address (for gasless transactions - optional)
VITE_TREASURY_ADDRESS=
```

**Note:** Do NOT commit `.env.local` to git. It's already in `.gitignore`.

---

## 🚀 Step-by-Step Deployment

### Phase 1: Compile Smart Contract (15 minutes)

#### 1.1 Navigate to Contract Directory
```bash
cd /Users/abba/Desktop/voxcard/voxcard-stacks
```

#### 1.2 Build the Contract
```bash
# Basic build (for testing)
clarinet wasm

# Check for compilation errors
# If successful, you'll see: artifacts/ajo_contract.wasm
```

**Expected Output:**
```
   Compiling voxcard-stacks v0.1.0 (/Users/abba/Desktop/voxcard/voxcard-stacks)
    Finished release [optimized] target(s) in X.XXs
```

**If you get errors:**
- Check Clarity version: `rustc --version` (should be 1.70+)
- Update toolchain: `rustup update`
- Clear cache: `clarinet clean && clarinet wasm`

#### 1.3 Optimize Contract (Optional but Recommended)

**Using Docker:**
```bash
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/clarinet/registry \
  Clarity/workspace-optimizer:0.12.11
```

**Expected Output:**
- Optimized WASM in `artifacts/` directory
- File size should be < 200KB

**If Docker not available:**
- Skip optimization for now
- Use the unoptimized build from `clarinet wasm`
- Note: This may cost more gas

#### 1.4 Verify Contract
```bash
# Check the WASM file
ls -lh artifacts/ajo_contract.wasm

# Optional: Check with Clarity-check
Clarity-check artifacts/ajo_contract.wasm
```

**✅ Phase 1 Complete if:**
- `artifacts/ajo_contract.wasm` exists
- File size is reasonable (<1MB)
- No compilation errors

---

### Phase 2: Deploy to STX Testnet (30-60 minutes)

#### 2.1 Install STX CLI (clarinet)

**Download:**
```bash
# Check STX docs for latest CLI installation
# https://docs.stacks.co/

# On macOS (if available via Homebrew):
# brew install clarinet

# Or download binary directly from STX releases
```

**Verify Installation:**
```bash
clarinet version
```

#### 2.2 Configure CLI for Testnet
```bash
# Set chain ID
export CHAIN_ID=xion-testnet-2

# Set node endpoint
export NODE=https://api.testnet.hiro.so:443

# Verify connection
clarinet status --node $NODE
```

#### 2.3 Import or Create Wallet

**Option A: Import Existing Wallet**
```bash
# Import from mnemonic
clarinet keys add voxcard-deployer --recover

# Enter your mnemonic when prompted
```

**Option B: Create New Wallet**
```bash
# Create new key
clarinet keys add voxcard-deployer

# IMPORTANT: Save the mnemonic shown!
# You'll need it to recover the wallet
```

**Check Your Address:**
```bash
clarinet keys show voxcard-deployer
```

**Check Balance:**
```bash
clarinet query bank balances $(clarinet keys show voxcard-deployer -a) --node $NODE
```

**Expected Output:**
```
balances:
- amount: "1000000"
  denom: microSTX
```

#### 2.4 Upload Contract to Testnet

```bash
# Upload WASM file
clarinet tx wasm store artifacts/ajo_contract.wasm \
  --from voxcard-deployer \
  --node $NODE \
  --chain-id $CHAIN_ID \
  --gas auto \
  --gas-adjustment 1.5 \
  --gas-prices 0.025microSTX \
  -y

# WAIT for transaction confirmation (~5 seconds)
```

**Expected Output:**
```
code: 0
txhash: [SOME_HASH]
...
```

**Get Code ID from Transaction:**
```bash
# Query the transaction
clarinet query tx [TRANSACTION_HASH] --node $NODE

# Look for "code_id" in the logs/events
# Example: code_id: 42
```

**Or Query Latest Code:**
```bash
clarinet query wasm list-code --node $NODE --reverse --limit 1
```

**Save your CODE_ID:**
```bash
export CODE_ID=<your_code_id>
echo $CODE_ID
```

#### 2.5 Instantiate Contract

```bash
# Prepare init message
cat > init.json << EOF
{}
EOF

# Instantiate the contract
clarinet tx wasm instantiate $CODE_ID "$(cat init.json)" \
  --from voxcard-deployer \
  --label "VoxCard-Savings-v1" \
  --admin $(clarinet keys show voxcard-deployer -a) \
  --node $NODE \
  --chain-id $CHAIN_ID \
  --gas auto \
  --gas-adjustment 1.5 \
  --gas-prices 0.025microSTX \
  -y
```

**Expected Output:**
```
code: 0
txhash: [ANOTHER_HASH]
...
```

**Get Contract Address:**
```bash
# Query the transaction
clarinet query tx [INSTANTIATE_TX_HASH] --node $NODE

# Look for "_contract_address" in logs
# Example: xion1abcd...
```

**Or Query Latest Contract:**
```bash
clarinet query wasm list-contract-by-code $CODE_ID --node $NODE
```

**Save Contract Address:**
```bash
export CONTRACT_ADDRESS=<your_contract_address>
echo $CONTRACT_ADDRESS

# IMPORTANT: Save this address!
# You'll need it for frontend configuration
```

**✅ Phase 2 Complete if:**
- Contract uploaded successfully (have CODE_ID)
- Contract instantiated (have CONTRACT_ADDRESS)
- Can query contract state (see next phase)

---

### Phase 3: Test Smart Contract Functions (1-2 hours)

#### 3.1 Verify Contract Deployed

```bash
# Query contract info
clarinet query wasm contract $CONTRACT_ADDRESS --node $NODE

# Query contract state (should be empty initially)
clarinet query wasm contract-state all $CONTRACT_ADDRESS --node $NODE
```

#### 3.2 Test: Create Plan

**Prepare create plan message:**
```bash
cat > create_plan.json << EOF
{
  "create_plan": {
    "name": "Test Savings Circle",
    "description": "Testing VoxCard on testnet",
    "total_participants": 3,
    "contribution_amount": "1000000",
    "frequency": "Monthly",
    "duration_months": 6,
    "trust_score_required": 0,
    "allow_partial": true
  }
}
EOF
```

**Execute create plan:**
```bash
clarinet tx wasm execute $CONTRACT_ADDRESS "$(cat create_plan.json)" \
  --from voxcard-deployer \
  --node $NODE \
  --chain-id $CHAIN_ID \
  --gas auto \
  --gas-adjustment 1.5 \
  --gas-prices 0.025microSTX \
  -y
```

**Verify plan created:**
```bash
# Query plan by ID (plan_id: 1 for first plan)
cat > query_plan.json << EOF
{
  "get_plan": {
    "plan_id": 1
  }
}
EOF

clarinet query wasm contract-state smart $CONTRACT_ADDRESS "$(cat query_plan.json)" --node $NODE
```

**Expected Output:**
```json
{
  "plan": {
    "id": 1,
    "name": "Test Savings Circle",
    "description": "Testing VoxCard on testnet",
    "total_participants": 3,
    "contribution_amount": "1000000",
    ...
  }
}
```

#### 3.3 Test: Request to Join Plan

**Prepare join request message:**
```bash
cat > join_request.json << EOF
{
  "request_to_join_plan": {
    "plan_id": 1
  }
}
EOF
```

**Execute join request:**
```bash
clarinet tx wasm execute $CONTRACT_ADDRESS "$(cat join_request.json)" \
  --from voxcard-deployer \
  --node $NODE \
  --chain-id $CHAIN_ID \
  --gas auto \
  --gas-adjustment 1.5 \
  --gas-prices 0.025microSTX \
  -y
```

#### 3.4 Test: Contribute

**Prepare contribute message:**
```bash
cat > contribute.json << EOF
{
  "contribute": {
    "plan_id": 1,
    "amount": "1000000"
  }
}
EOF
```

**Execute contribute (with funds):**
```bash
clarinet tx wasm execute $CONTRACT_ADDRESS "$(cat contribute.json)" \
  --from voxcard-deployer \
  --amount 1000000microSTX \
  --node $NODE \
  --chain-id $CHAIN_ID \
  --gas auto \
  --gas-adjustment 1.5 \
  --gas-prices 0.025microSTX \
  -y
```

**Verify contribution:**
```bash
# Query participant cycle status
cat > query_status.json << EOF
{
  "get_participant_cycle_status": {
    "plan_id": 1,
    "participant": "$(clarinet keys show voxcard-deployer -a)"
  }
}
EOF

clarinet query wasm contract-state smart $CONTRACT_ADDRESS "$(cat query_status.json)" --node $NODE
```

#### 3.5 Test: Query Trust Score

```bash
cat > query_trust.json << EOF
{
  "get_trust_score": {
    "user": "$(clarinet keys show voxcard-deployer -a)"
  }
}
EOF

clarinet query wasm contract-state smart $CONTRACT_ADDRESS "$(cat query_trust.json)" --node $NODE
```

**✅ Phase 3 Complete if:**
- Successfully created a plan
- Successfully made a contribution
- Can query plan details and participant status
- Trust score updated appropriately

---

### Phase 4: Frontend Integration (1-2 hours)

#### 4.1 Update Environment Variables

**Edit `/Users/abba/Desktop/voxcard/frontend/.env.local`:**

```bash
VITE_RPC_URL=https://api.testnet.hiro.so/
VITE_REST_URL=https://api.testnet.hiro.so/
VITE_CONTRACT_ADDRESS=<YOUR_CONTRACT_ADDRESS_FROM_PHASE_2>
```

#### 4.2 Install Dependencies

```bash
cd /Users/abba/Desktop/voxcard/frontend
pnpm install
```

#### 4.3 Start Development Server

```bash
pnpm dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: use --host to expose
```

#### 4.4 Test Frontend Flow

**Open Browser:**
```
http://localhost:8080
```

**Test Steps:**
1. **Connect Wallet**
   - Click "Connect Wallet" or equivalent button
   - @stacks/connect modal should appear
   - Connect with your Stacks testnet wallet
   - Verify connection (address displayed)

2. **Create Plan**
   - Navigate to "Create Group" page
   - Fill out form:
     - Name: "Frontend Test Plan"
     - Description: "Testing end-to-end integration"
     - Participants: 3
     - Amount: 10 STX
     - Frequency: Monthly
     - Duration: 6 months
     - Trust score: 0
     - Partial: enabled
   - Click "Create Group"
   - Approve transaction in wallet popup
   - Wait for confirmation
   - Should redirect to dashboard

3. **View Plan**
   - Navigate to "Dashboard" or "My Groups"
   - Verify your created plan appears
   - Click on plan to view details
   - Verify all parameters match

4. **Make Contribution**
   - On plan detail page, find "Contribute" button
   - Enter amount (e.g., 10 STX)
   - Click contribute
   - Approve transaction
   - Wait for confirmation
   - Verify contribution reflected in UI

5. **Check Trust Score**
   - Navigate to Dashboard
   - Verify trust score displayed
   - Should have increased from default (50)

**✅ Phase 4 Complete if:**
- Wallet connects successfully
- Can create plan from UI
- Plan appears in dashboard
- Can make contribution
- Trust score updates
- No console errors

---

## 🎯 Success Criteria

### Minimum Viable Test (Must Complete)

- [ ] **Contract Compiled:** `ajo_contract.wasm` exists
- [ ] **Contract Deployed:** Have valid CONTRACT_ADDRESS
- [ ] **Can Create Plan:** Successfully executed CreatePlan
- [ ] **Can Query Plan:** Retrieved plan data from contract
- [ ] **Can Contribute:** Made contribution with funds
- [ ] **Frontend Connects:** Wallet integration works
- [ ] **End-to-End Flow:** Created plan from UI, made contribution

### Comprehensive Test (Ideal)

- [ ] **All Basic Tests:** Above minimum tests pass
- [ ] **Join Request Flow:** Tested request, approve, deny
- [ ] **Trust Score:** Verified score updates on-chain
- [ ] **Cycle Tracking:** Verified personal cycle calculation
- [ ] **Payout Logic:** Tested auto-payout trigger
- [ ] **Error Handling:** Frontend gracefully handles failures
- [ ] **Transaction History:** Can view past transactions
- [ ] **Multi-User:** Tested with 2+ different wallets

---

## 🐛 Troubleshooting

### Issue: "clarinet wasm" fails

**Symptoms:** Compilation errors, missing dependencies

**Solutions:**
```bash
# Update Clarity
rustup update

# Clear cache
clarinet clean

# Try again
clarinet wasm

# If still failing, check Cargo.toml dependencies
cat Cargo.toml
```

### Issue: "clarinet command not found"

**Symptoms:** CLI not installed or not in PATH

**Solutions:**
```bash
# Check if installed
which clarinet

# If not installed, download from STX docs
# Or use alternative: wasmd CLI (generic Clarity)

# Add to PATH if needed
export PATH=$PATH:/path/to/clarinet
```

### Issue: "Insufficient funds" when deploying

**Symptoms:** Transaction fails with "insufficient funds" error

**Solutions:**
```bash
# Check balance
clarinet query bank balances $(clarinet keys show voxcard-deployer -a) --node $NODE

# If balance is 0, request from faucet:
# 1. Join STX Discord
# 2. Go to #testnet-faucet
# 3. Type: /faucet <your-address>

# Verify tokens received
clarinet query bank balances $(clarinet keys show voxcard-deployer -a) --node $NODE
```

### Issue: "Contract instantiation fails"

**Symptoms:** "Invalid input" or similar error

**Solutions:**
```bash
# Verify init message is valid JSON
cat init.json | jq

# Check contract was uploaded correctly
clarinet query wasm code $CODE_ID --node $NODE

# Try with more gas
--gas 2000000

# Check contract logs for error details
clarinet query tx [TX_HASH] --node $NODE
```

### Issue: "Wallet won't connect in frontend"

**Symptoms:** @stacks/connect modal doesn't appear or errors

**Solutions:**
1. **Check browser console for errors**
2. **Verify environment variables are set**
   ```bash
   cat frontend/.env.local
   ```
3. **Clear browser cache**
4. **Try different browser (Chrome works best)**
5. **Check @stacks/connect SDK version**
   ```bash
   cat frontend/package.json | grep @stacks/connect
   ```

### Issue: "Frontend can't query contract"

**Symptoms:** "Contract not found" or similar

**Solutions:**
1. **Verify CONTRACT_ADDRESS in .env.local**
2. **Restart dev server after updating .env**
   ```bash
   # Stop server (Ctrl+C)
   pnpm dev
   ```
3. **Check RPC endpoint is responsive**
   ```bash
   curl https://api.testnet.hiro.so/status
   ```
4. **Check contract actually exists**
   ```bash
   clarinet query wasm contract $CONTRACT_ADDRESS --node $NODE
   ```

---

## 📊 Performance Benchmarks

### Expected Gas Costs (Testnet)

| Operation | Gas Used | Cost (microSTX) | Cost (XION) |
|-----------|----------|--------------|-------------|
| Upload Contract | ~2,000,000 | 50,000 | 0.05 |
| Instantiate | ~200,000 | 5,000 | 0.005 |
| Create Plan | ~150,000 | 3,750 | 0.00375 |
| Join Request | ~100,000 | 2,500 | 0.0025 |
| Approve Join | ~120,000 | 3,000 | 0.003 |
| Contribute | ~180,000 | 4,500 | 0.0045 |
| Query (free) | 0 | 0 | 0 |

**Note:** 1 STX = 1,000,000 microSTX

### Expected Transaction Times

- **Upload/Instantiate:** 5-10 seconds
- **Execute transactions:** 3-6 seconds
- **Queries:** <1 second

---

## 📝 Validation Report Template

After completing technical validation, document:

### Deployment Summary

**Smart Contract:**
- Code ID: `_____`
- Contract Address: `_____`
- Deployment TX: `_____`
- Deploy Time: `_____ seconds`

**Tests Completed:**
- [ ] Create Plan
- [ ] Request Join
- [ ] Approve Join
- [ ] Contribute
- [ ] Query Plan
- [ ] Query Trust Score
- [ ] Query Cycle Status

**Frontend Integration:**
- [ ] Wallet connects
- [ ] Create plan from UI
- [ ] View plan details
- [ ] Make contribution
- [ ] View trust score

### Issues Encountered

| Issue | Solution | Time Lost |
|-------|----------|-----------|
| ... | ... | ... |

### Performance Notes

- Average transaction time: `_____ seconds`
- Average gas cost: `_____ microSTX`
- Frontend load time: `_____ ms`

### Conclusion

**Technical Feasibility:** ✅ Proven / ⚠️ Needs Work / ❌ Blocked

**Blockers (if any):**
- ...

**Recommendations:**
- ...

---

## 🚀 Next Steps After Technical Validation

### If Technical Validation PASSES ✅

1. **Document Everything:**
   - Save contract address in PRD
   - Update README with deployment info
   - Screenshot successful transactions

2. **Continue User Validation:**
   - Focus on user interviews (Days 1-3)
   - Show working prototype to interviewees
   - Gather feedback on UX

3. **Plan Beta Launch:**
   - Set up monitoring/analytics
   - Prepare onboarding docs
   - Create support channels

### If Technical Validation FAILS ❌

1. **Document Issues:**
   - What specifically failed?
   - Why did it fail?
   - Is it fixable in timeframe?

2. **Consider Pivot:**
   - Can you simplify the approach?
   - Different blockchain needed?
   - Hybrid solution (off-chain + on-chain)?

3. **Re-evaluate Scope:**
   - What's truly necessary for MVP?
   - What can be removed/deferred?

---

## 📞 Resources

### STX Documentation
- Docs: https://docs.stacks.co/
- Discord: https://discord.gg/xion
- Explorer: https://www.explorer.hiro.so/?chain=testnet

### Clarity Resources
- Docs: https://docs.Clarity.com/
- Book: https://book.Clarity.com/
- Examples: https://github.com/Clarity/cw-examples

### Developer Tools
- Clarity: https://www.rust-lang.org/
- Docker: https://docs.docker.com/
- PNPM: https://pnpm.io/

---

## ✅ Quick Validation Checklist

**Before starting:**
- [ ] Read VALIDATION_PLAN.md
- [ ] Set up Stacks testnet wallet
- [ ] Get testnet tokens
- [ ] Have 4-6 hours available

**Phase 1: Compile** (15 min)
- [ ] `clarinet wasm` succeeds
- [ ] `artifacts/ajo_contract.wasm` exists

**Phase 2: Deploy** (30-60 min)
- [ ] Contract uploaded (have CODE_ID)
- [ ] Contract instantiated (have CONTRACT_ADDRESS)

**Phase 3: Test Contract** (1-2 hours)
- [ ] Create plan works
- [ ] Contribute works
- [ ] Query works

**Phase 4: Frontend** (1-2 hours)
- [ ] Wallet connects
- [ ] End-to-end flow works

**Done!** 🎉
- [ ] Update VALIDATION_PLAN.md with results
- [ ] Continue with user validation

---

**Ready to deploy? Start with Phase 1! Good luck! 🚀**

