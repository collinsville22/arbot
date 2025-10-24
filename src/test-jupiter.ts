/**
 * Test Jupiter V6 API Integration
 * Verifies that we can fetch real quotes from Jupiter
 */
import { JupiterClient, TOKENS } from './arbitrage/jupiter';

async function testJupiterAPI() {
  console.log('Testing Jupiter V6 API Integration...\n');

  const jupiter = new JupiterClient();

  try {
    console.log('Fetching quote: SOL → USDC');
    console.log('Amount: 0.1 SOL (100,000,000 lamports)\n');

    const route = await jupiter.getRoute(
      TOKENS.SOL,
      TOKENS.USDC,
      100000000, // 0.1 SOL
      50 // 0.5% slippage
    );

    if (!route) {
      console.log('Failed to get route from Jupiter');
      process.exit(1);
    }

    console.log('Successfully fetched route from Jupiter!\n');
    console.log('Route Details:');
    console.log(`  Input:  ${route.inputMint.slice(0, 8)}... (SOL)`);
    console.log(`  Output: ${route.outputMint.slice(0, 8)}... (USDC)`);
    console.log(`  In Amount:  ${route.inAmount} lamports`);
    console.log(`  Out Amount: ${route.outAmount} (USDC smallest unit)`);
    console.log(`  Price Impact: ${route.priceImpactPct}%`);
    console.log(`  Slippage: ${route.slippageBps / 100}%`);

    console.log('\nJupiter V6 API is working correctly!');
    console.log('\nNext: Test triangular arbitrage route simulation...\n');

    // Test triangular route
    console.log('Testing: SOL → USDC → USDT → SOL');
    const triangularResult = await jupiter.executeTriangularRoute(
      TOKENS.SOL,
      [TOKENS.USDC, TOKENS.USDT],
      100000000, // 0.1 SOL
      50
    );

    if (!triangularResult) {
      console.log('Failed to simulate triangular route');
      process.exit(1);
    }

    const profit = jupiter.calculateCircularProfit(100000000, triangularResult.finalAmount);

    console.log('\nTriangular route simulation successful!');
    console.log(`  Started with:  100,000,000 lamports (0.1 SOL)`);
    console.log(`  Ended with:    ${triangularResult.finalAmount} lamports`);
    console.log(`  Profit/Loss:   ${profit.toFixed(4)}%`);

    if (profit > 0) {
      console.log(`  This route would be PROFITABLE!`);
    } else {
      console.log(`  This route would lose money (normal - arbitrage is rare)`);
    }

    console.log('\nAll Jupiter tests passed!');
    console.log('The bot is ready to scan for real arbitrage opportunities.');

  } catch (error: any) {
    console.error('Jupiter API test failed:', error.message);
    process.exit(1);
  }
}

testJupiterAPI();
