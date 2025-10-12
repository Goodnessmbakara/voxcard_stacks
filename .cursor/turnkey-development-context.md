# Turnkey Development Context & Best Practices

## Overview
This document provides essential context and rules for working with Turnkey in the VoxCard project. Follow these guidelines to ensure proper integration and avoid common pitfalls.

## Key Principles

### 1. Authentication Flow
- Users sign in with **Google accounts** via Turnkey's embedded wallet system
- Authentication creates a Turnkey organization with associated wallets
- Each user gets a **Stacks-compatible wallet** automatically generated

### 2. Wallet Structure
- **walletAccountId**: Internal Turnkey identifier for the account
- **stacksAddress**: The actual Stacks blockchain address (e.g., `ST1SH8BVDJ1VKQAYWVK7NN00D03J5EQ66KBZEJH8X`)
- **organizationId**: Turnkey organization identifier
- **walletId**: Turnkey wallet identifier

### 3. Signing Transactions

#### Critical Rules:
1. **Always use `httpClient`** from `useTurnkey()` hook for signing operations
2. **Use `stacksAddress` as `signWith`** parameter, NOT `walletAccountId`
3. **Never use raw client objects** - always use the provided HTTP client
4. **Validate all required fields** before making signing requests

#### Correct API Structure:
```typescript
const response = await httpClient.signRawPayload({
  signWith: account.stacksAddress, // ✅ Correct: Use Stacks address
  payload: preSignHash,
  encoding: "PAYLOAD_ENCODING_HEXADECIMAL",
  hashFunction: "HASH_FUNCTION_NOT_APPLICABLE",
});
```

#### Common Mistakes to Avoid:
```typescript
// ❌ WRONG: Using walletAccountId
signWith: account.walletAccountId

// ❌ WRONG: Using nested parameter structure
{
  type: "ACTIVITY_TYPE_SIGN_RAW_PAYLOAD_V2",
  parameters: { signWith: ... }
}

// ❌ WRONG: Using raw client instead of httpClient
const turnkeyClient = client ?? passkeyClient ?? walletClient
```

### 4. Error Handling

#### Common Error Patterns:
- **"Could not find any resource to sign with"**: Usually means wrong `signWith` parameter
- **"404 Not Found"**: Indicates incorrect API endpoint or structure
- **"invalid request"**: Missing required fields in API call

#### Debugging Steps:
1. Log account details to verify wallet structure
2. Validate `stacksAddress` is present and valid
3. Check `httpClient` is available from `useTurnkey()`
4. Verify API call structure matches Turnkey documentation

### 5. Stacks Integration

#### Address Formats:
- **Mainnet**: `SP...` prefix
- **Testnet**: `ST...` prefix (current development environment)

#### Transaction Signing:
- Use `buildPreSignHash()` for transaction hash generation
- Apply `formatStacksSignature()` for signature formatting
- Always validate signature components (`r`, `s`, `v`) before use

### 6. Development Workflow

#### When Working with Turnkey:
1. **Always check Turnkey documentation** for latest API changes
2. **Test with both mainnet and testnet** configurations
3. **Validate wallet creation** before attempting transactions
4. **Monitor console logs** for detailed error information
5. **Use proper TypeScript types** from `@turnkey/react-wallet-kit`

#### Testing Checklist:
- [ ] User can authenticate with Google
- [ ] Wallet is created and address is generated
- [ ] Account details are properly logged
- [ ] Signing requests use correct parameters
- [ ] Transactions broadcast successfully
- [ ] Error handling provides meaningful feedback

### 7. File Locations

#### Key Files:
- `frontend/src/context/TurnkeyWalletProvider.tsx` - Main Turnkey integration
- `frontend/src/context/StacksContractProvider.tsx` - Contract interaction layer
- `frontend/src/pages/CreatePlan.tsx` - Transaction initiation point

#### Configuration:
- Environment variables in `.env` files
- Network configuration in `TurnkeyWalletProvider.tsx`
- Contract addresses in `StacksContractProvider.tsx`

### 8. Troubleshooting Guide

#### If Signing Fails:
1. Verify `httpClient` is not null/undefined
2. Check `account.stacksAddress` is valid Stacks format
3. Ensure `preSignHash` is properly generated
4. Validate all required API parameters are present
5. Check Turnkey API status and rate limits

#### If Wallet Creation Fails:
1. Verify Turnkey API keys are configured
2. Check network connectivity
3. Validate organization permissions
4. Review Turnkey dashboard for account status

### 9. Best Practices

#### Code Quality:
- Always use TypeScript for type safety
- Implement proper error boundaries
- Log detailed information for debugging
- Use consistent naming conventions

#### Security:
- Never log private keys or sensitive data
- Validate all user inputs
- Use proper error messages (don't expose internals)
- Follow Turnkey security guidelines

#### Performance:
- Cache wallet data when possible
- Minimize API calls
- Use proper loading states
- Implement retry logic for failed requests

## References

### Documentation:
- [Turnkey Bitcoin Support](https://docs.turnkey.com/networks/bitcoin)
- [Turnkey React Wallet Kit](https://docs.turnkey.com/sdks/react)
- [Turnkey Signing API](https://docs.turnkey.com/api-reference/activities/sign-raw-payload)

### Examples:
- [bitcoinjs-lib Examples](https://github.com/bitcoinjs/bitcoinjs-lib)
- [Turnkey Bitcoin SDK Example](https://github.com/tkhq/sdk/blob/main/examples/with-bitcoin/src/signer.ts)

### Support:
- Turnkey Support: help@turnkey.com
- GitHub Issues: For SDK-specific problems
- Discord/Community: For general development questions

---

**Remember**: When in doubt, check the Turnkey documentation first. The API evolves frequently, and this context file should be updated accordingly.

