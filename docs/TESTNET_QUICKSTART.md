# VoxCard Testnet Quick Start Guide

Get started with VoxCard on Stacks testnet in 5 minutes! 🚀

---

## 🎯 Prerequisites

1. **Leather Wallet** or **Xverse Wallet** installed
2. Wallet configured for **Testnet** mode
3. Test STX from the faucet

---

## 📝 Step 1: Get Testnet STX

1. Visit the Stacks testnet faucet:
   ```
   https://explorer.hiro.so/sandbox/faucet?chain=testnet
   ```

2. Enter your testnet address and request STX

3. Wait for confirmation (usually 1-2 minutes)

---

## 🔧 Step 2: Set Up the Frontend

### Clone and Install

```bash
cd /Users/abba/Desktop/voxcard/frontend

# Install dependencies (if not already done)
pnpm install

# The .env file should already be configured with:
# VITE_STACKS_NETWORK=testnet
# VITE_CONTRACT_ADDRESS=ST3DSAPR2WF7D7SMR6W0R436AA6YYTD8RFT9E9NPH
# VITE_CONTRACT_NAME=voxcard-savings
```

### Start the Development Server

```bash
pnpm run dev
```

The app will be available at `http://localhost:5173`

---

## 🎮 Step 3: Connect Your Wallet

1. Open the app in your browser
2. Click "Connect Wallet" in the header
3. Select your wallet (Leather or Xverse)
4. Approve the connection request
5. Ensure you're on **Testnet** network

---

## 💡 Step 4: Create Your First Savings Plan

### Via UI
1. Navigate to "Create Plan" page
2. Fill in the plan details:
   - **Name:** e.g., "Monthly Savings Circle"
   - **Description:** Brief description of the plan
   - **Participants:** e.g., 5
   - **Contribution:** e.g., 100 STX
   - **Frequency:** monthly/weekly/daily
   - **Duration:** e.g., 12 months
   - **Trust Score:** e.g., 50
   - **Allow Partial:** Yes/No
3. Click "Create Plan"
4. Approve transaction in wallet
5. Wait for confirmation

### Via Contract Call (Advanced)
```typescript
import { useContract } from "@/context/StacksContractProvider";

const { createPlan } = useContract();

await createPlan({
  name: "Monthly Savings",
  description: "Save 100 STX monthly with friends",
  total_participants: 5,
  contribution_amount: "100",
  frequency: "monthly",
  duration_months: 12,
  trust_score_required: 50,
  allow_partial: true
});
```

---

## 👥 Step 5: Join a Plan

### Via UI
1. Browse available plans on "Plans" page
2. Click on a plan to view details
3. Click "Request to Join"
4. Approve transaction in wallet
5. Wait for plan creator to approve your request

### Via Contract Call (Advanced)
```typescript
const { requestJoinPlan } = useContract();

// Join plan with ID 1
await requestJoinPlan(1);
```

---

## 💰 Step 6: Make a Contribution

### Via UI
1. Go to your Dashboard
2. Select the plan you've joined
3. Click "Contribute"
4. Enter amount (or use the suggested amount)
5. Approve transaction in wallet

### Via Contract Call (Advanced)
```typescript
const { contribute } = useContract();

// Contribute 100 STX (in microSTX)
await contribute(1, "100000000");
```

---

## 🔍 Step 7: Monitor Your Plans

### Check Plan Status
```typescript
const { getPlanById } = useContract();

const { plan } = await getPlanById(1);
console.log(plan);
```

### Check Your Contribution Status
```typescript
const { getParticipantCycleStatus } = useContract();

const status = await getParticipantCycleStatus(1, yourAddress);
console.log({
  contributed: status.contributed_this_cycle,
  remaining: status.remaining_this_cycle,
  isRecipient: status.is_recipient_this_cycle
});
```

### Check Your Trust Score
```typescript
const { getTrustScore } = useContract();

const score = await getTrustScore(yourAddress);
console.log("Trust Score:", score);
```

---

## 🎯 Common Test Scenarios

### Scenario 1: Complete Savings Cycle
1. Create a plan with 3 participants
2. Have all participants join
3. Make initial contributions
4. Advance cycle
5. Distribute funds to recipient
6. Repeat for all cycles

### Scenario 2: Partial Contributions
1. Create a plan with `allow_partial: true`
2. Make partial contributions
3. Verify contributions are tracked correctly
4. Complete remaining amount

### Scenario 3: Trust Score Management
1. Successfully complete contributions to increase score
2. Miss contributions to see score impact
3. Verify score affects plan eligibility

---

## 🧪 Testing Checklist

- [ ] Connect wallet successfully
- [ ] Create a new savings plan
- [ ] Request to join existing plan
- [ ] Get join request approved
- [ ] Make first contribution
- [ ] View plan details
- [ ] Check contribution status
- [ ] View trust score
- [ ] Test partial contributions
- [ ] Advance cycle (as creator)
- [ ] Distribute funds
- [ ] Withdraw excess
- [ ] Complete full savings cycle

---

## 📊 View on Explorer

Monitor all activities on the Stacks Explorer:

### Your Address
```
https://explorer.hiro.so/address/YOUR_ADDRESS?chain=testnet
```

### Contract
```
https://explorer.hiro.so/txid/ST3DSAPR2WF7D7SMR6W0R436AA6YYTD8RFT9E9NPH.voxcard-savings?chain=testnet
```

### Transaction
After each transaction, get the tx ID and view it:
```
https://explorer.hiro.so/txid/YOUR_TX_ID?chain=testnet
```

---

## 🐛 Troubleshooting

### Wallet Won't Connect
- Ensure wallet extension is installed and unlocked
- Switch to testnet mode in wallet settings
- Clear browser cache and try again
- Try a different browser

### Transaction Fails
- **Insufficient Balance:** Get more test STX from faucet
- **Wrong Network:** Switch wallet to testnet
- **Contract Error:** Check error message in wallet
- **Invalid Parameters:** Verify all inputs are correct

### Can't See Plans
- Ensure wallet is connected
- Check that you're on the correct network
- Verify contract address in `.env` file
- Check browser console for errors

### Build Errors
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuild
pnpm run build
```

---

## 🔄 Reset Testnet Wallet

If you need to start fresh:

1. Create a new wallet address
2. Get testnet STX from faucet
3. Clear browser local storage
4. Reconnect wallet

---

## 📝 API Testing

### Using cURL

#### Get Plan Count
```bash
curl https://api.testnet.hiro.so/v2/contracts/call-read/ST3DSAPR2WF7D7SMR6W0R436AA6YYTD8RFT9E9NPH/voxcard-savings/get-plan-count \
  -H "Content-Type: application/json" \
  -d '{"sender":"YOUR_ADDRESS","arguments":[]}'
```

#### Get Plan Details
```bash
curl https://api.testnet.hiro.so/v2/contracts/call-read/ST3DSAPR2WF7D7SMR6W0R436AA6YYTD8RFT9E9NPH/voxcard-savings/get-plan \
  -H "Content-Type: application/json" \
  -d '{"sender":"YOUR_ADDRESS","arguments":["0x0100000000000000000000000000000001"]}'
```

### Using Stacks.js

```typescript
import { callReadOnlyFunction, cvToJSON, uintCV } from "@stacks/transactions";
import { StacksTestnet } from "@stacks/network";

const network = new StacksTestnet();

// Get plan count
const countResult = await callReadOnlyFunction({
  contractAddress: "ST3DSAPR2WF7D7SMR6W0R436AA6YYTD8RFT9E9NPH",
  contractName: "voxcard-savings",
  functionName: "get-plan-count",
  functionArgs: [],
  network,
  senderAddress: yourAddress,
});

console.log("Total plans:", cvToJSON(countResult).value);
```

---

## 🎓 Learning Resources

### Stacks Development
- [Stacks Documentation](https://docs.stacks.co)
- [Clarity Book](https://book.clarity-lang.org)
- [Stacks.js Guide](https://stacks.js.org)

### VoxCard Specific
- [Contract Documentation](../voxcard-stacks/CONTRACT_DOCUMENTATION.md)
- [Test Report](../voxcard-stacks/TEST_REPORT.md)
- [Deployment Guide](./TESTNET_DEPLOYMENT.md)

---

## 💬 Get Help

### Issues?
- Check the [troubleshooting section](#-troubleshooting) above
- View contract on explorer for detailed errors
- Check browser console for frontend errors
- Review network tab for API issues

### Need Support?
- [Stacks Discord](https://discord.gg/stacks)
- [GitHub Issues](https://github.com/your-repo/issues)
- [Stacks Forum](https://forum.stacks.org)

---

## ✅ Success Criteria

You've successfully tested VoxCard when you can:

1. ✅ Connect wallet and see your balance
2. ✅ Create a savings plan
3. ✅ Join another user's plan
4. ✅ Make contributions
5. ✅ Advance cycles
6. ✅ Distribute funds
7. ✅ Track your trust score
8. ✅ View transaction history

---

**Happy Testing! 🎉**

Found a bug? Have feedback? Open an issue on GitHub!

