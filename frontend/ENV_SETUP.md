# Environment Variables Setup

Create a `.env` file in the `frontend` directory with the following variables:

```bash
# Stacks Network Configuration
# Options: "mainnet" or "testnet"
VITE_STACKS_NETWORK=testnet

# Contract Configuration
# The Stacks address where your contract is deployed
VITE_CONTRACT_ADDRESS=ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1

# The name of your deployed contract
VITE_CONTRACT_NAME=voxcard-savings-v3

# Turnkey Embedded Wallet Configuration
# Values provided by your Turnkey dashboard
VITE_TURNKEY_ORGANIZATION_ID=your-turnkey-organization-id
VITE_AUTH_PROXY_CONFIG_ID=your-auth-proxy-config-id
# Optional: override only if you are using a custom Turnkey API domain
# VITE_TURNKEY_API_BASE_URL=https://api.turnkey.com
```

## Network Details

### Testnet
- API Endpoint: `https://api.testnet.hiro.so`
- Explorer: `https://explorer.hiro.so/?chain=testnet`

### Mainnet
- API Endpoint: `https://api.mainnet.hiro.so`
- Explorer: `https://explorer.hiro.so/?chain=mainnet`

## After Deployment

✅ **Contract Successfully Deployed!**

Your VoxCard Savings contract has been deployed to Stacks Testnet:
- **Contract Address:** `ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1.voxcard-savings-v3`
- **Transaction ID:** `7a22a1c31a1cf143b19edfcca93d9a5364ea5336a6350cd3be724b0afba7f314`
- **Transaction Status:** ✅ Success - Pending Confirmation
- **Explorer:** https://explorer.hiro.so/txid/7a22a1c31a1cf143b19edfcca93d9a5364ea5336a6350cd3be724b0afba7f314?chain=testnet
- **Contract Interface:** https://explorer.hiro.so/txid/ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1.voxcard-savings-v3?chain=testnet
- **Deployment Date:** October 12, 2025
- **Version:** v3 - Fixed nonce increment timing to prevent empty plan creation

### Important Notes
- **sBTC Support:** Currently disabled as sBTC contracts are not available on testnet
- **Asset Type:** STX-only for now
- **Functions:** 28 functions exposed (all STX-related functionality working)

The environment variables have been updated automatically. When ready for production:
1. Deploy to mainnet
2. Update `VITE_CONTRACT_ADDRESS` with your mainnet contract address
3. Set `VITE_STACKS_NETWORK` to `mainnet`
4. Re-enable sBTC support if needed

## Wallet Integration

The application uses `@stacks/connect` for wallet integration, which supports:
- Leather Wallet (formerly Hiro Wallet)
- Xverse Wallet
- Other Stacks-compatible wallets

Users will be prompted to connect their wallet when they first interact with the application.
