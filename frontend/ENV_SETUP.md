# Environment Variables Setup

Create a `.env` file in the `frontend` directory with the following variables:

```bash
# Stacks Network Configuration
# Options: "mainnet" or "testnet"
VITE_STACKS_NETWORK=testnet

# Contract Configuration
# The Stacks address where your contract is deployed
VITE_CONTRACT_ADDRESS=ST3DSAPR2WF7D7SMR6W0R436AA6YYTD8RFT9E9NPH

# The name of your deployed contract
VITE_CONTRACT_NAME=voxcard-savings

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

After deploying your contract to Stacks:
1. Update `VITE_CONTRACT_ADDRESS` with your deployed contract address
2. Update `VITE_CONTRACT_NAME` if you used a different name
3. Set `VITE_STACKS_NETWORK` to `mainnet` when ready for production

## Wallet Integration

The application uses `@stacks/connect` for wallet integration, which supports:
- Leather Wallet (formerly Hiro Wallet)
- Xverse Wallet
- Other Stacks-compatible wallets

Users will be prompted to connect their wallet when they first interact with the application.
