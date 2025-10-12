import transactionsPkg from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';
import * as bip39 from 'bip39';

const { privateKeyToAddress } = transactionsPkg;

const mnemonic = "mask option execute uniform resemble vacuum calm enforce vehicle blast valve focus";

// Validate mnemonic
if (!bip39.validateMnemonic(mnemonic)) {
  console.error('❌ Invalid mnemonic phrase provided');
  process.exit(1);
}

console.log('🔍 Checking different derivation paths...\n');

const seed = bip39.mnemonicToSeedSync(mnemonic);
const hdkey = await import('hdkey');
const HDKey = hdkey.default;
const hd = HDKey.fromMasterSeed(seed);

// Common derivation paths to try
const derivationPaths = [
  "m/44'/5757'/0'/0/0",    // Standard Stacks
  "m/44'/5757'/0'/0/1",    // Next index
  "m/44'/5757'/0'/0/2",    // Next index
  "m/44'/5757'/0'/0/3",    // Next index
  "m/44'/5757'/0'/0/4",    // Next index
  "m/44'/5757'/0'/0/5",    // Next index
  "m/44'/5757'/0'/0/6",    // Next index
  "m/44'/5757'/0'/0/7",    // Next index
  "m/44'/5757'/0'/0/8",    // Next index
  "m/44'/5757'/0'/0/9",    // Next index
  "m/44'/5757'/0'/0/10",   // Next index
  "m/44'/5757'/0'/1/0",    // Change address
  "m/44'/5757'/1'/0/0",    // Different account
  "m/44'/5757'/0'/0",      // Without index
];

const expectedAddress = 'ST3DSAPR2WF7D7SMR6W0R436AA6YYTD8RFT9E9NPH';

console.log(`Looking for address: ${expectedAddress}\n`);

for (const path of derivationPaths) {
  try {
    const child = hd.derive(path);
    const privateKey = child.privateKey.toString('hex');
    const address = privateKeyToAddress(privateKey);
    
    console.log(`Path: ${path}`);
    console.log(`Address: ${address}`);
    console.log(`Match: ${address === expectedAddress ? '✅ YES' : '❌ No'}`);
    
    if (address === expectedAddress) {
      console.log(`\n🎉 Found matching address!`);
      console.log(`Private key: ${privateKey}`);
      console.log(`Derivation path: ${path}`);
      break;
    }
    console.log('');
  } catch (error) {
    console.log(`Path: ${path} - Error: ${error.message}\n`);
  }
}
