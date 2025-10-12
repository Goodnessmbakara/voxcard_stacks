# Turnkey Development Rules for Cursor Agent

## Context File Reference
Always reference `.cursor/turnkey-development-context.md` when working with Turnkey-related code.

## Critical Rules

### 1. Signing Operations
- **ALWAYS** use `httpClient` from `useTurnkey()` hook
- **ALWAYS** use `account.stacksAddress` as `signWith` parameter (NOT `walletAccountId`)
- **NEVER** use raw client objects for signing
- **ALWAYS** validate all required fields before API calls

### 2. Error Handling
- **ALWAYS** log account details when debugging signing issues
- **ALWAYS** check for "Could not find any resource to sign with" errors
- **ALWAYS** verify API call structure matches Turnkey documentation

### 3. Wallet Structure
- Users have valid wallets with `stacksAddress` after Google authentication
- `walletAccountId` is internal identifier, not for signing
- `stacksAddress` is the actual blockchain address for transactions

### 4. Code Changes
- **ALWAYS** test signing operations after any changes
- **ALWAYS** check console logs for detailed error information
- **ALWAYS** validate TypeScript types from `@turnkey/react-wallet-kit`

### 5. Documentation Priority
1. Check `.cursor/turnkey-development-context.md` first
2. Reference official Turnkey documentation
3. Use provided examples from GitHub repositories

## Quick Debug Checklist
When signing fails:
- [ ] Is `httpClient` available?
- [ ] Is `account.stacksAddress` valid?
- [ ] Are all API parameters correct?
- [ ] Is the API call structure proper?
- [ ] Are error messages logged?

## File Locations
- Main integration: `frontend/src/context/TurnkeyWalletProvider.tsx`
- Contract layer: `frontend/src/context/StacksContractProvider.tsx`
- Transaction UI: `frontend/src/pages/CreatePlan.tsx`

