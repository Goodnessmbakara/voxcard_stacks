interface ImportMetaEnv {
  readonly VITE_TREASURY_ADDRESS: string;
  readonly VITE_CONTRACT_ADDRESS: string;
  readonly VITE_CONTRACT_NAME: string;
  readonly VITE_RPC_URL: string;
  readonly VITE_REST_URL: string;
  readonly VITE_ORGANIZATION_ID: string;
  readonly VITE_AUTH_PROXY_CONFIG_ID: string;
  readonly VITE_TURNKEY_API_BASE_URL: string;
  readonly VITE_TURNKEY_ORGANIZATION_ID: string;
  readonly VITE_SBTC_TOKEN_CONTRACT: string;
  readonly VITE_STACKS_NETWORK: string;
  // Add any other env variables here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
