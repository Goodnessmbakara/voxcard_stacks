import { mnemonicToPrivKeyLeather } from 'stacks-testing-helpers';
import transactionsPkg from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';

const { privateKeyToAddress } = transactionsPkg;

const mnemonic = "mask option execute uniform resemble vacuum calm enforce vehicle blast valve focus";
const expectedAddress = 'ST3DSAPR2WF7D7SMR6W0R436AA6YYTD8RFT9E9NPH';

console.log('🔍 Testing different approaches for Leather wallet derivation...\n');

// Test 1: Standard Leather derivation
console.log('1. Standard Leather derivation (BIP84):');
try {
  const privateKey = mnemonicToPrivKeyLeather(mnemonic);
  const address = privateKeyToAddress(privateKey);
  console.log(`   Private key: ${privateKey}`);
  console.log(`   Address: ${address}`);
  console.log(`   Match: ${address === expectedAddress ? '✅ YES' : '❌ No'}\n`);
} catch (error) {
  console.log(`   Error: ${error.message}\n`);
}

// Test 2: Try to convert mainnet to testnet
console.log('2. Checking if we can convert mainnet to testnet:');
try {
  const privateKey = mnemonicToPrivKeyLeather(mnemonic);
  const mainnetAddress = privateKeyToAddress(privateKey);
  
  // Check if the addresses are similar (same hash, different prefix)
  const mainnetHash = mainnetAddress.substring(2); // Remove SP prefix
  const expectedHash = expectedAddress.substring(2); // Remove ST prefix
  
  console.log(`   Mainnet address: ${mainnetAddress}`);
  console.log(`   Expected testnet: ${expectedAddress}`);
  console.log(`   Mainnet hash: ${mainnetHash}`);
  console.log(`   Expected hash: ${expectedHash}`);
  console.log(`   Hash match: ${mainnetHash === expectedHash ? '✅ YES' : '❌ No'}\n`);
  
  if (mainnetHash === expectedHash) {
    console.log('   🎉 Found match! The private key is correct, just need testnet version.\n');
  }
} catch (error) {
  console.log(`   Error: ${error.message}\n`);
}

// Test 3: Check if we can derive testnet address directly
console.log('3. Attempting direct testnet derivation:');
try {
  // Try to use the same private key but derive testnet address
  const privateKey = mnemonicToPrivKeyLeather(mnemonic);
  
  // Check if there's a way to derive testnet address
  console.log(`   Private key: ${privateKey}`);
  console.log('   Note: The private key might be correct, but we need to find the right way to derive testnet address.\n');
} catch (error) {
  console.log(`   Error: ${error.message}\n`);
}

console.log('💡 Next steps:');
console.log('1. If hash matches, the private key is correct and we just need to use it for testnet');
console.log('2. If not, we need to try different derivation paths or account indices');
console.log('3. We can also try using the private key directly in the deployment script');
