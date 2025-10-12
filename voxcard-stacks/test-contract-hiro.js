#!/usr/bin/env node

/**
 * Comprehensive Contract Testing Script using Hiro API
 * Tests all contract functions end-to-end with real testnet data
 */

import txPkg from "@stacks/transactions";
const { 
  callReadOnlyFunction, 
  uintCV, 
  principalCV, 
  stringUtf8CV, 
  stringAsciiCV, 
  boolCV,
  cvToJSON 
} = txPkg;
import networkPkg from "@stacks/network";
const { StacksTestnet } = networkPkg;

// Contract configuration
const CONTRACT_ADDRESS = "ST240V2R09J62PD2KDMJ5Z5X85VAB4VNJ9NZ6XBS1";
const CONTRACT_NAME = "voxcard-savings-v2";
const network = new StacksTestnet();

// Test addresses
const TEST_ADDRESS_1 = "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM";
const TEST_ADDRESS_2 = "ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG";

console.log("🚀 Starting Comprehensive Contract Testing with Hiro API");
console.log("=" .repeat(60));

// Helper function to make API calls with error handling
async function testReadOnlyFunction(functionName, args = [], description = "") {
  try {
    console.log(`\n📋 Testing: ${functionName}`);
    if (description) console.log(`   ${description}`);
    
    const result = await callReadOnlyFunction({
      contractAddress: CONTRACT_ADDRESS,
      contractName: CONTRACT_NAME,
      functionName,
      functionArgs: args,
      network,
      senderAddress: CONTRACT_ADDRESS,
    });

    const jsonResult = cvToJSON(result);
    console.log(`   ✅ Raw Result:`, JSON.stringify(jsonResult, null, 2));
    
    // Try to extract the actual value
    let extractedValue = jsonResult;
    if (jsonResult && jsonResult.type === 'response') {
      if (jsonResult.value && jsonResult.value.ok) {
        extractedValue = jsonResult.value.value;
        console.log(`   📊 Extracted Value:`, JSON.stringify(extractedValue, null, 2));
      } else {
        console.log(`   ⚠️  Response Error:`, jsonResult.value);
      }
    }
    
    return { success: true, result: jsonResult, extracted: extractedValue };
  } catch (error) {
    console.log(`   ❌ Error:`, error.message);
    return { success: false, error: error.message };
  }
}

// Helper function to test with direct API call
async function testDirectAPI(functionName, args = []) {
  try {
    console.log(`\n🌐 Direct API Test: ${functionName}`);
    
    const response = await fetch(`https://api.testnet.hiro.so/v2/contracts/call-read/${CONTRACT_ADDRESS}/${CONTRACT_NAME}/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        sender: CONTRACT_ADDRESS, 
        arguments: args.map(arg => {
          if (typeof arg === 'object' && arg.type) {
            return arg;
          }
          return arg;
        })
      })
    });
    
    const data = await response.json();
    console.log(`   📡 Direct API Result:`, JSON.stringify(data, null, 2));
    
    return { success: true, result: data };
  } catch (error) {
    console.log(`   ❌ Direct API Error:`, error.message);
    return { success: false, error: error.message };
  }
}

// Test plan normalization logic
function testPlanNormalization(rawPlanData) {
  console.log(`\n🔧 Testing Plan Normalization`);
  console.log(`   Raw Plan Data:`, JSON.stringify(rawPlanData, null, 2));
  
  // Simulate the normalization logic from StacksContractProvider
  function normalizePlan(rawPlan) {
    if (!rawPlan || typeof rawPlan !== "object") {
      console.log(`   ❌ Invalid plan data:`, rawPlan);
      return null;
    }

    const getField = (keys, fallback) => {
      for (const key of keys) {
        if (rawPlan[key] !== undefined) {
          return rawPlan[key];
        }
      }
      return fallback;
    };

    const idValue = getField(["plan-id", "plan_id", "id"]);
    if (idValue === undefined || idValue === null) {
      console.log(`   ❌ Missing plan ID`);
      return null;
    }

    const contributionMicro = getField(["contribution-amount", "contribution_amount", "contributionAmount"], 0) ?? 0;
    const contributionStx = typeof contributionMicro === "number"
      ? (contributionMicro / 1_000_000).toString()
      : String(contributionMicro ?? "0");

    const participants = ensureArray(getField(["participants"], [])).map(p => String(p));
    const joinRequests = ensureArray(getField(["join-requests", "join_requests"], [])).map(r => String(r));

    const normalized = {
      id: String(idValue),
      name: getField(["name", "plan-name", "plan_name"], ""),
      description: getField(["description", "plan-description", "plan_description"], ""),
      creator: getField(["creator", "creator-address", "creator_address"], ""),
      total_participants: Number(getField(["total-participants", "total_participants", "participantCount"], 0)),
      contribution_amount: contributionStx,
      frequency: getField(["frequency"], ""),
      duration_months: Number(getField(["duration-months", "duration_months", "durationMonths"], 0)),
      trust_score_required: Number(getField(["trust-score-required", "trust_score_required", "trustScoreRequired"], 0)),
      allow_partial: Boolean(getField(["allow-partial", "allow_partial", "allowPartial"], false)),
      participants,
      join_requests: joinRequests,
      created_at: Number(getField(["created-at", "created_at", "createdAt"], 0)),
    };

    console.log(`   ✅ Normalized Plan:`, JSON.stringify(normalized, null, 2));
    return normalized;
  }

  function ensureArray(value) {
    if (Array.isArray(value)) return value;
    if (value === null || value === undefined) return [];
    if (typeof value === "object") return Object.values(value);
    return [value];
  }

  return normalizePlan(rawPlanData);
}

// Main testing function
async function runComprehensiveTests() {
  console.log(`\n🎯 Testing Contract: ${CONTRACT_ADDRESS}.${CONTRACT_NAME}`);
  
  // Test 1: Get plan count
  await testReadOnlyFunction("get-plan-count", [], "Get total number of plans");
  await testDirectAPI("get-plan-count", []);
  
  // Test 2: Test individual plan retrieval
  console.log(`\n📊 Testing Individual Plan Retrieval`);
  for (let planId = 1; planId <= 5; planId++) {
    console.log(`\n--- Testing Plan ID: ${planId} ---`);
    
    // Test with callReadOnlyFunction
    const result1 = await testReadOnlyFunction("get-plan", [uintCV(planId)], `Get plan ${planId}`);
    
    // Test with direct API
    const result2 = await testDirectAPI("get-plan", [uintCV(planId)]);
    
    // Test normalization if we got data
    if (result1.success && result1.extracted) {
      testPlanNormalization(result1.extracted);
    }
  }
  
  // Test 3: Get plans by creator
  await testReadOnlyFunction("get-plans-by-creator", [principalCV(TEST_ADDRESS_1)], `Get plans by creator ${TEST_ADDRESS_1}`);
  await testDirectAPI("get-plans-by-creator", [principalCV(TEST_ADDRESS_1)]);
  
  // Test 4: Get trust score
  await testReadOnlyFunction("get-trust-score", [principalCV(TEST_ADDRESS_1)], `Get trust score for ${TEST_ADDRESS_1}`);
  await testDirectAPI("get-trust-score", [principalCV(TEST_ADDRESS_1)]);
  
  // Test 5: Get trust score details
  await testReadOnlyFunction("get-trust-score-details", [principalCV(TEST_ADDRESS_1)], `Get trust score details for ${TEST_ADDRESS_1}`);
  await testDirectAPI("get-trust-score-details", [principalCV(TEST_ADDRESS_1)]);
  
  // Test 6: Get join requests for plan 1
  await testReadOnlyFunction("get-join-requests", [uintCV(1)], "Get join requests for plan 1");
  await testDirectAPI("get-join-requests", [uintCV(1)]);
  
  // Test 7: Get plan participants for plan 1
  await testReadOnlyFunction("get-plan-participants", [uintCV(1)], "Get participants for plan 1");
  await testDirectAPI("get-plan-participants", [uintCV(1)]);
  
  // Test 8: Check if user is participant
  await testReadOnlyFunction("is-participant", [uintCV(1), principalCV(TEST_ADDRESS_1)], `Check if ${TEST_ADDRESS_1} is participant in plan 1`);
  await testDirectAPI("is-participant", [uintCV(1), principalCV(TEST_ADDRESS_1)]);
  
  // Test 9: Get participant details
  await testReadOnlyFunction("get-participant-details", [uintCV(1), principalCV(TEST_ADDRESS_1)], `Get participant details for ${TEST_ADDRESS_1} in plan 1`);
  await testDirectAPI("get-participant-details", [uintCV(1), principalCV(TEST_ADDRESS_1)]);
  
  // Test 10: Get participant cycle status
  await testReadOnlyFunction("get-participant-cycle-status", [uintCV(1), principalCV(TEST_ADDRESS_1)], `Get cycle status for ${TEST_ADDRESS_1} in plan 1`);
  await testDirectAPI("get-participant-cycle-status", [uintCV(1), principalCV(TEST_ADDRESS_1)]);
  
  // Test 11: Get platform fee
  await testReadOnlyFunction("get-platform-fee-bps", [], "Get platform fee in basis points");
  await testDirectAPI("get-platform-fee-bps", []);
  
  console.log(`\n🎉 Testing Complete!`);
  console.log("=" .repeat(60));
}

// Run the tests
runComprehensiveTests().catch(console.error);
