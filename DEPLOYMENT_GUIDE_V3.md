# 🚀 VoxCard Savings V3 Deployment Guide

## ✅ Deployment Complete!

The VoxCard Savings smart contract V3 has been successfully deployed to Stacks Testnet with a critical bug fix.

---

## 📋 Quick Start

### 1. Create Environment Variables

Create a `.env` file in the `frontend` directory:

```bash
cd frontend
cat > .env << 'EOF'
# Stacks Network Configuration
VITE_STACKS_NETWORK=testnet

# Contract Configuration - V3 (Fixed nonce bug)
VITE_CONTRACT_ADDRESS=ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1
VITE_CONTRACT_NAME=voxcard-savings-v3

# Turnkey Embedded Wallet Configuration
VITE_TURNKEY_ORGANIZATION_ID=your-turnkey-organization-id
VITE_AUTH_PROXY_CONFIG_ID=your-auth-proxy-config-id
EOF
```

### 2. Update Turnkey Credentials

Replace the placeholder values in `.env` with your actual Turnkey credentials from your Turnkey dashboard.

### 3. Restart the Frontend

```bash
cd frontend
pnpm run dev
```

### 4. Wait for Contract Confirmation

The deployment transaction is pending confirmation. Check status here:
https://explorer.hiro.so/txid/7a22a1c31a1cf143b19edfcca93d9a5364ea5336a6350cd3be724b0afba7f314?chain=testnet

⏳ Typically takes 10-20 minutes (1-2 blocks)

---

## 🔧 What Was Fixed in V3?

### The Problem
The contract had a **critical bug** where the `plan-nonce` was incremented too early in the `create-plan` function. This caused:

❌ Nonce incremented before data was saved  
❌ If any subsequent operation failed, you'd get:
  - ✅ Incremented plan count
  - ❌ Empty/missing plan data
  - 🐛 "Ghost" plans with IDs but no content

### The Solution
Moved the nonce increment to the **very last step** of the function:

```clarity
;; BEFORE (buggy):
(map-set plans ...)                    ;; Line 330
(map-set plan-participant-list ...)    ;; Line 350
(map-set plan-participants ...)        ;; Line 362
(map-set plan-participant-list ...)    ;; Line 374
(var-set plan-nonce plan-id)          ;; Line 380 ⚠️ TOO EARLY!
(map-set creator-plans ...)            ;; Line 383 - Could fail after nonce++
(map-set trust-scores ...)             ;; Line 398 - Could fail after nonce++
(ok plan-id)

;; AFTER (fixed):
(map-set plans ...)                    ;; Line 330
(map-set plan-participant-list ...)    ;; Line 350
(map-set plan-participants ...)        ;; Line 362
(map-set plan-participant-list ...)    ;; Line 374
(map-set creator-plans ...)            ;; Line 379
(map-set trust-scores ...)             ;; Line 388
(var-set plan-nonce plan-id)          ;; Line 408 ✅ SAFE POSITION!
(ok plan-id)                           ;; Line 410
```

Now the nonce only increments **after all data is successfully stored**.

---

## 📊 Deployment Details

### Contract Information
| Property | Value |
|----------|-------|
| **Contract Address** | `ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1.voxcard-savings-v3` |
| **Transaction ID** | `7a22a1c31a1cf143b19edfcca93d9a5364ea5336a6350cd3be724b0afba7f314` |
| **Network** | Stacks Testnet |
| **Deployer** | `ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1` |
| **Version** | v3 |
| **Deployment Date** | October 12, 2025 |
| **Gas Fee** | 0.3 STX |
| **Status** | ⏳ Pending Confirmation |

### Important Links
- 🔍 **Transaction:** https://explorer.hiro.so/txid/7a22a1c31a1cf143b19edfcca93d9a5364ea5336a6350cd3be724b0afba7f314?chain=testnet
- 📄 **Contract Interface:** https://explorer.hiro.so/txid/ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1.voxcard-savings-v3?chain=testnet

---

## ✅ Validation Results

### Contract Validation
```bash
cd voxcard-stacks
clarinet check
```
- ✅ **Status:** Passed
- ✅ **Contracts Checked:** 4
- ⚠️ **Warnings:** 64 (standard unchecked data warnings - acceptable)
- ✅ **Errors:** 0
- ✅ **Syntax:** Valid Clarity v3

### Test Suite
```bash
cd voxcard-stacks
pnpm test
```
- ✅ **Total Tests:** 37
- ✅ **Passed:** 37
- ❌ **Failed:** 0
- ⏱️ **Duration:** 1.58s
- 📦 **Test File:** `tests/voxcard-savings.test.ts`

**Test Coverage:**
- ✅ Plan Creation & Reading
- ✅ Join Request Management
- ✅ Contribution Handling
- ✅ Trust Score System
- ✅ Admin Functions
- ✅ Input Validation
- ✅ Error Handling
- ✅ Access Control

---

## 🔄 Files Updated

### Smart Contract
- ✅ `voxcard-stacks/contracts/voxcard-savings.clar`
  - Moved nonce increment from line 380 to line 408

### Deployment Scripts
- ✅ `voxcard-stacks/deploy-final.js`
  - Updated contract name to `voxcard-savings-v3`

### Frontend Configuration
- ✅ `frontend/ENV_SETUP.md`
  - Updated contract name reference
  - Updated deployment information
  - Added v3 version note

### Frontend Components
- ✅ `frontend/src/components/WalletTest.tsx`
  - Updated contract name to `voxcard-savings-v3`

### Documentation
- ✅ `CONTRACT_DEPLOYMENT_V3.md` (new)
  - Comprehensive deployment documentation
- ✅ `DEPLOYMENT_GUIDE_V3.md` (this file)
  - Step-by-step setup guide

---

## 🧪 Testing the Fix

Once the transaction confirms, verify the fix works:

### 1. Create a Test Plan

```typescript
// Frontend - CreatePlan page
{
  name: "Test Plan V3",
  description: "Testing nonce fix",
  total_participants: 5,
  contribution_amount: "1000000", // 1 STX
  frequency: "Monthly",
  duration_months: 6,
  trust_score_required: 50,
  allow_partial: false,
  asset_type: "STX"
}
```

### 2. Verify Plan Created Successfully

```bash
# Check plan count
curl https://api.testnet.hiro.so/v2/contracts/call-read/ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1/voxcard-savings-v3/get-plan-count

# Check plan data (replace <plan-id> with actual ID)
curl https://api.testnet.hiro.so/v2/contracts/call-read/ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1/voxcard-savings-v3/get-plan \
  -d '{"sender":"ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1","arguments":["0x<plan-id>"]}'
```

### 3. Expected Behavior (Fixed)

✅ Plan counter increments by 1  
✅ Plan data is fully populated with correct values  
✅ Plan name, description, and all fields are present  
✅ Creator is correctly set  
✅ No empty or default values  
✅ No "ghost" plans

### 4. Old Behavior (Buggy - V1/V2)

❌ Plan counter incremented  
❌ Plan data might be missing or empty  
❌ Could see incremented IDs with no corresponding data  
❌ Inconsistent state between nonce and actual plans

---

## 🔐 Security & Best Practices

### Input Validation
All inputs are validated before processing:
- ✅ Name: 1-100 characters
- ✅ Description: 1-500 characters
- ✅ Participants: 2-100
- ✅ Amount: ≥ 100 microSTX (0.0001 STX)
- ✅ Frequency: Daily/Weekly/Biweekly/Monthly
- ✅ Duration: 1-24 months
- ✅ Trust Score: 0-100
- ✅ Asset Type: STX or sBTC

### Access Control
- 🔒 Owner-only functions: `set-platform-fee-bps`, `pause-plan`, `reactivate-plan`
- 🔒 Creator-only functions: `approve-join-request`, `deny-join-request`
- 🔒 Participant-only functions: `contribute`

### Data Integrity
- ✅ All critical operations use `asserts!` for validation
- ✅ Trust scores bounded to 0-100
- ✅ **Nonce increments only after successful data storage**
- ✅ Contribution tracking with completion flags

---

## 📚 Contract Capabilities

### Public Functions (8)
1. `create-plan` - Create a savings plan
2. `request-to-join-plan` - Request to join
3. `approve-join-request` - Approve a request (creator only)
4. `deny-join-request` - Deny a request (creator only)
5. `contribute` - Make STX contribution
6. `set-platform-fee-bps` - Set fee (owner only)
7. `pause-plan` - Emergency pause (owner only)
8. `reactivate-plan` - Reactivate (owner only)

### Read-Only Functions (20)
- `get-plan` - Get plan details
- `get-plan-count` - Get total plans created
- `get-plans-by-creator` - Get plans by creator
- `get-participant-cycle-status` - Get contribution status
- `get-trust-score` - Get user trust score
- `get-trust-score-details` - Get detailed trust data
- `get-join-requests` - Get pending requests
- `get-plan-participants` - Get plan participants
- `is-participant` - Check participation
- `get-participant-details` - Get participant info
- `get-platform-fee-bps` - Get platform fee
- And more...

---

## 🚧 Known Limitations

### Current Limitations
- sBTC support disabled (contracts not available on testnet yet)
- Maximum 100 participants per plan
- Maximum 24 month duration
- Simplified creator plan indexing

### Future Enhancements
- [ ] Enable sBTC when available on testnet
- [ ] Enhanced multi-plan creator indexing
- [ ] Automated payout distribution
- [ ] Automated cycle advancement
- [ ] Missed contribution penalty system
- [ ] Advanced reputation scoring

---

## 🐛 Troubleshooting

### Issue: Frontend not connecting to contract
**Solution:** Ensure `.env` file exists with correct values:
```bash
cd frontend
cat .env | grep VITE_CONTRACT_NAME
# Should output: VITE_CONTRACT_NAME=voxcard-savings-v3
```

### Issue: Transaction pending for > 30 minutes
**Solution:** Check network status:
- https://status.hiro.so
- https://explorer.hiro.so/?chain=testnet

### Issue: "Contract not found" error
**Solution:** Wait for transaction confirmation, then check:
```bash
curl https://api.testnet.hiro.so/v2/contracts/interface/ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1/voxcard-savings-v3
```

### Issue: Old contract name still being used
**Solution:** Clear browser cache and restart dev server:
```bash
cd frontend
rm -rf node_modules/.vite
pnpm run dev
```

---

## 📞 Support & Resources

### Documentation
- 📖 Contract Code: `/voxcard-stacks/contracts/voxcard-savings.clar`
- 📖 Tests: `/voxcard-stacks/tests/voxcard-savings.test.ts`
- 📖 Frontend Integration: `/frontend/src/context/StacksContractProvider.tsx`

### Commands Reference
```bash
# Validate contract
cd voxcard-stacks && clarinet check

# Run tests
cd voxcard-stacks && pnpm test

# Deploy contract (if needed)
cd voxcard-stacks && node deploy-final.js

# Start frontend
cd frontend && pnpm run dev

# Build frontend
cd frontend && pnpm run build
```

### Network APIs
- **Testnet API:** https://api.testnet.hiro.so
- **Testnet Explorer:** https://explorer.hiro.so/?chain=testnet
- **Mainnet API:** https://api.mainnet.hiro.so
- **Mainnet Explorer:** https://explorer.hiro.so/?chain=mainnet

---

## 🎯 Next Steps

1. ⏳ **Wait for confirmation** (~10-20 minutes)
2. ✍️ **Create `.env` file** with correct configuration
3. 🔑 **Add Turnkey credentials** to `.env`
4. 🚀 **Restart frontend** dev server
5. 🧪 **Test plan creation** to verify fix
6. ✅ **Verify no empty plans** are created
7. 🎉 **Start using V3!**

---

**Deployment Status:** ✅ Complete  
**Contract Status:** ⏳ Pending Confirmation  
**Ready for Testing:** 🕐 After confirmation  

**Monitor Transaction:**  
https://explorer.hiro.so/txid/7a22a1c31a1cf143b19edfcca93d9a5364ea5336a6350cd3be724b0afba7f314?chain=testnet

