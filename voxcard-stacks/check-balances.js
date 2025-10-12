import * as bip39 from 'bip39';
import transactionsPkg from '@stacks/transactions';
import { STACKS_TESTNET } from '@stacks/network';

const { privateKeyToAddress } = transactionsPkg;

const mnemonic = "mask option execute uniform resemble vacuum calm enforce vehicle blast valve focus";
const expectedAddress = 'ST3DSAPR2WF7D7SMR6W0R436AA6YYTD8RFT9E9NPH';

console.log('🔍 Checking STX balances for different derivation paths...\n');

if (!bip39.validateMnemonic(mnemonic)) {
  console.error('❌ Invalid mnemonic phrase');
  process.exit(1);
}

const seed = bip39.mnemonicToSeedSync(mnemonic);
const hdkey = await import('hdkey');
const HDKey = hdkey.default;
const hd = HDKey.fromMasterSeed(seed);

// Function to check STX balance
async function checkSTXBalance(address) {
  try {
    const response = await fetch(`${STACKS_TESTNET.coreApiUrl}/extended/v1/address/${address}/stx`);
    if (response.ok) {
      const data = await response.json();
      const balance = data.balance ? parseInt(data.balance) : 0;
      return balance;
    }
    return 0;
  } catch (error) {
    return 0;
  }
}

// Try different account indices (0-10)
console.log('Testing different account indices (m/44\'/5757\'/X\'/0/0):');
for (let account = 0; account <= 10; account++) {
  try {
    const path = `m/44'/5757'/${account}'/0/0`;
    const child = hd.derive(path);
    const privateKey = child.privateKey.toString('hex');
    const address = privateKeyToAddress(privateKey);
    
    const balance = await checkSTXBalance(address);
    const isExpected = address === expectedAddress;
    const hasTokens = balance > 0;
    
    console.log(`Account ${account}: ${address}`);
    console.log(`  Balance: ${balance} microSTX (${balance / 1000000} STX)`);
    console.log(`  Expected: ${isExpected ? '✅ YES' : '❌ No'}`);
    console.log(`  Has tokens: ${hasTokens ? '💰 YES' : '❌ No'}`);
    
    if (isExpected && hasTokens) {
      console.log(`\n🎉 Found the correct derivation!`);
      console.log(`Derivation path: ${path}`);
      console.log(`Private key: ${privateKey}`);
      console.log(`Address: ${address}`);
      console.log(`Balance: ${balance} microSTX`);
      break;
    }
    console.log('');
  } catch (error) {
    console.log(`Account ${account}: Error - ${error.message}\n`);
  }
}

console.log('\n' + '='.repeat(60) + '\n');

// Try different address indices (0-10) for account 0
console.log('Testing different address indices (m/44\'/5757\'/0\'/0/X):');
for (let addrIndex = 0; addrIndex <= 10; addrIndex++) {
  try {
    const path = `m/44'/5757'/0'/0/${addrIndex}`;
    const child = hd.derive(path);
    const privateKey = child.privateKey.toString('hex');
    const address = privateKeyToAddress(privateKey);
    
    const balance = await checkSTXBalance(address);
    const isExpected = address === expectedAddress;
    const hasTokens = balance > 0;
    
    console.log(`Index ${addrIndex}: ${address}`);
    console.log(`  Balance: ${balance} microSTX (${balance / 1000000} STX)`);
    console.log(`  Expected: ${isExpected ? '✅ YES' : '❌ No'}`);
    console.log(`  Has tokens: ${hasTokens ? '💰 YES' : '❌ No'}`);
    
    if (isExpected && hasTokens) {
      console.log(`\n🎉 Found the correct derivation!`);
      console.log(`Derivation path: ${path}`);
      console.log(`Private key: ${privateKey}`);
      console.log(`Address: ${address}`);
      console.log(`Balance: ${balance} microSTX`);
      break;
    }
    console.log('');
  } catch (error) {
    console.log(`Index ${addrIndex}: Error - ${error.message}\n`);
  }
}

console.log('\n' + '='.repeat(60) + '\n');

// Try different change addresses (m/44'/5757'/0'/X/0)
console.log('Testing different change addresses (m/44\'/5757\'/0\'/X/0):');
for (let change = 0; change <= 5; change++) {
  try {
    const path = `m/44'/5757'/0'/${change}/0`;
    const child = hd.derive(path);
    const privateKey = child.privateKey.toString('hex');
    const address = privateKeyToAddress(privateKey);
    
    const balance = await checkSTXBalance(address);
    const isExpected = address === expectedAddress;
    const hasTokens = balance > 0;
    
    console.log(`Change ${change}: ${address}`);
    console.log(`  Balance: ${balance} microSTX (${balance / 1000000} STX)`);
    console.log(`  Expected: ${isExpected ? '✅ YES' : '❌ No'}`);
    console.log(`  Has tokens: ${hasTokens ? '💰 YES' : '❌ No'}`);
    
    if (isExpected && hasTokens) {
      console.log(`\n🎉 Found the correct derivation!`);
      console.log(`Derivation path: ${path}`);
      console.log(`Private key: ${privateKey}`);
      console.log(`Address: ${address}`);
      console.log(`Balance: ${balance} microSTX`);
      break;
    }
    console.log('');
  } catch (error) {
    console.log(`Change ${change}: Error - ${error.message}\n`);
  }
}

console.log('\n💡 If no matches found, we may need to try different derivation paths or the mnemonic might be for a different wallet.');
