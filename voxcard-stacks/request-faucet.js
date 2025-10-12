import fetch from 'node-fetch';

const address = 'ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1';

console.log('🚰 Requesting testnet STX from faucet...');
console.log(`Address: ${address}\n`);

async function requestFromFaucet() {
  try {
    // Try the Hiro faucet first
    console.log('Trying Hiro faucet...');
    const response = await fetch('https://api.testnet.hiro.so/extended/v1/faucets/stx', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: address,
        stacking: false
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Faucet request successful!');
      console.log('Response:', result);
      
      if (result.txId) {
        console.log(`\nTransaction ID: ${result.txId}`);
        console.log(`View transaction: https://explorer.hiro.so/txid/${result.txId}?chain=testnet`);
        console.log('\n⏳ Waiting for confirmation...');
        
        // Wait a bit and check balance
        setTimeout(async () => {
          await checkBalance();
        }, 10000); // Wait 10 seconds
      }
    } else {
      console.log('❌ Hiro faucet failed:', result);
      
      // Try alternative faucet
      console.log('\nTrying alternative faucet...');
      await tryAlternativeFaucet();
    }
    
  } catch (error) {
    console.error('❌ Error with Hiro faucet:', error.message);
    await tryAlternativeFaucet();
  }
}

async function tryAlternativeFaucet() {
  try {
    // Try the Stacks Explorer faucet
    const response = await fetch('https://explorer.stacks.co/sandbox/faucet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        address: address
      })
    });

    const result = await response.text();
    
    if (response.ok) {
      console.log('✅ Alternative faucet request successful!');
      console.log('Response:', result);
    } else {
      console.log('❌ Alternative faucet failed:', result);
      console.log('\n💡 Manual faucet options:');
      console.log('1. Visit: https://explorer.hiro.so/sandbox/faucet?chain=testnet');
      console.log('2. Enter address:', address);
      console.log('3. Click "Request STX"');
    }
    
  } catch (error) {
    console.error('❌ Error with alternative faucet:', error.message);
    console.log('\n💡 Manual faucet options:');
    console.log('1. Visit: https://explorer.hiro.so/sandbox/faucet?chain=testnet');
    console.log('2. Enter address:', address);
    console.log('3. Click "Request STX"');
  }
}

async function checkBalance() {
  try {
    const response = await fetch(`https://api.testnet.hiro.so/extended/v1/address/${address}/stx`);
    const data = await response.json();
    const balance = data.balance ? parseInt(data.balance) : 0;
    
    console.log(`\n💰 Current balance: ${balance} microSTX (${balance / 1000000} STX)`);
    
    if (balance > 0) {
      console.log('🎉 Address is funded! Ready for deployment.');
    } else {
      console.log('⏳ Still waiting for tokens... You may need to wait a few more minutes.');
    }
  } catch (error) {
    console.error('Error checking balance:', error.message);
  }
}

requestFromFaucet();
