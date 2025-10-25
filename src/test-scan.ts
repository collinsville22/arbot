/**
 * Test arbitrage opportunity scanning
 * This will scan for opportunities without executing trades
 */
import { ArbitrageDetector } from './arbitrage/detector';

async function testScanning() {
  console.log('Testing Arbitrage Opportunity Scanning...\n');
  console.log('This will scan all triangular routes for profitable opportunities.');
  console.log('No trades will be executed - just simulation.\n');

  const detector = new ArbitrageDetector(
    0.01, // 0.01% minimum profit
    0.1   // 0.1 SOL trade size
  );

  console.log('Starting scan...\n');

  const opportunities = await detector.scanOpportunities();

  console.log(`\n====================`);
  console.log(`SCAN COMPLETE`);
  console.log(`====================`);
  console.log(`Opportunities found: ${opportunities.length}`);

  if (opportunities.length > 0) {
    console.log(`\nTop opportunities:`);
    opportunities.slice(0, 3).forEach((opp, index) => {
      console.log(`\n${index + 1}. ${opp.routeName}`);
      console.log(`   Profit: ${opp.profitPercentage.toFixed(4)}%`);
      console.log(`   Input: ${opp.inputAmount / 1e9} SOL`);
      console.log(`   Output: ${opp.expectedOutput / 1e9} SOL`);
    });
  } else {
    console.log('\nNo profitable opportunities found at this time.');
    console.log('This is normal - arbitrage opportunities are rare and competitive.');
  }

  console.log('\nTest complete!');
}

testScanning().catch(console.error);
