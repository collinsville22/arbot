import { Connection, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { ArbitrageDetector } from './arbitrage/detector';
import { ArbitrageExecutor } from './arbitrage/executor';
import config from './config';

/**
 * Real Arbitrage Bot with Gateway Integration
 * Based on proven patterns from LaneOlsons repository
 */
export class RealArbitrageBot {
  private detector: ArbitrageDetector;
  private executor: ArbitrageExecutor;
  private connection: Connection;
  private wallet;
  private isRunning: boolean = false;

  constructor() {
    this.detector = new ArbitrageDetector(
      config.trading.minProfitSol,
      config.trading.positionSizeSol
    );
    this.executor = new ArbitrageExecutor();
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.wallet = config.wallet.getKeypair();

    console.log(`
Real Arbitrage Bot Initialized
================================================
Wallet: ${this.wallet.publicKey.toBase58()}
Network: ${config.solana.network}
Gateway: ${config.gateway.rpcUrl}
Min Profit: ${config.trading.minProfitSol}%
Trade Size: ${config.trading.positionSizeSol} SOL
================================================
    `);
  }

  /**
   * Check wallet balance before starting
   */
  async checkBalance(): Promise<boolean> {
    const balance = await this.connection.getBalance(this.wallet.publicKey);
    const balanceSol = balance / LAMPORTS_PER_SOL;

    console.log(`\nWallet Balance: ${balanceSol.toFixed(6)} SOL`);

    if (balanceSol < config.trading.positionSizeSol) {
      console.log(`\nWARNING: Insufficient balance for trading!`);
      console.log(`Required: ${config.trading.positionSizeSol} SOL`);
      console.log(`Available: ${balanceSol.toFixed(6)} SOL`);
      return false;
    }

    return true;
  }

  /**
   * Start the arbitrage bot
   */
  async start(): Promise<void> {
    // Check balance first
    const hasBalance = await this.checkBalance();
    if (!hasBalance) {
      console.log(`\nPlease fund your wallet before starting.`);
      return;
    }

    this.isRunning = true;
    console.log(`\nStarting arbitrage bot...`);
    console.log(`Scanning for opportunities every 5 seconds...\n`);

    let scanCount = 0;
    let opportunitiesFound = 0;
    let successfulTrades = 0;

    while (this.isRunning) {
      try {
        scanCount++;
        console.log(`\n[${ scanCount }] Scanning...`);

        // Scan for opportunities
        const opportunities = await this.detector.scanOpportunities();

        if (opportunities.length > 0) {
          opportunitiesFound += opportunities.length;
          console.log(`\nFound ${opportunities.length} opportunities!`);

          // Execute best opportunity
          const best = opportunities[0];
          console.log(`\nExecuting best opportunity: ${best.routeName}`);
          console.log(`Expected profit: ${best.profitPercentage.toFixed(4)}%`);

          const success = await this.executor.executeOpportunity(best);
          if (success) {
            successfulTrades++;
          }

          // Print stats
          console.log(`\n--- Stats ---`);
          console.log(`Scans: ${scanCount}`);
          console.log(`Opportunities found: ${opportunitiesFound}`);
          console.log(`Successful trades: ${successfulTrades}`);
          console.log(`Success rate: ${((successfulTrades / opportunitiesFound) * 100).toFixed(1)}%`);
        } else {
          console.log(`No opportunities found. Continuing...`);
        }

        // Wait before next scan
        await this.sleep(5000);
      } catch (error) {
        console.error('Bot error:', error);
        await this.sleep(5000);
      }
    }
  }

  /**
   * Stop the bot
   */
  stop(): void {
    this.isRunning = false;
    console.log(`\nStopping arbitrage bot...`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
