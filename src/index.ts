import { RealArbitrageBot } from './arbitrage-bot';

/**
 * Main Entry Point
 * Start the real arbitrage bot with Gateway integration
 */
async function main() {
  console.log(`
================================================
     GATEWAY ARBITRAGE BOT - MAINNET
================================================
  `);

  const bot = new RealArbitrageBot();

  // Check wallet balance
  const hasBalance = await bot.checkBalance();
  if (!hasBalance) {
    console.log('\nInsufficient balance. Please fund your wallet.');
    process.exit(1);
  }

  // Start the bot
  await bot.start();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
