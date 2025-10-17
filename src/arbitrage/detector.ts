import { JupiterClient, ARBITRAGE_PAIRS, JupiterRoute } from './jupiter';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface ArbitrageOpportunity {
  pair: string;
  inputMint: string;
  outputMint: string;
  inputAmount: number;
  expectedOutput: number;
  profitPercentage: number;
  route: JupiterRoute;
  timestamp: number;
}

export class ArbitrageDetector {
  private jupiter: JupiterClient;
  private minProfitPercent: number;
  private tradeSize: number;

  constructor(minProfitPercent: number = 0.5, tradeSizeSol: number = 0.1) {
    this.jupiter = new JupiterClient();
    this.minProfitPercent = minProfitPercent;
    this.tradeSize = tradeSizeSol * LAMPORTS_PER_SOL;
  }

  /**
   * Scan for arbitrage opportunities
   * Based on LaneOlsons approach - checks all pairs for profitable routes
   */
  async scanOpportunities(): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];

    console.log(`\nScanning ${ARBITRAGE_PAIRS.length} pairs for arbitrage...`);

    for (const pair of ARBITRAGE_PAIRS) {
      try {
        const route = await this.jupiter.getRoute(
          pair.input,
          pair.output,
          this.tradeSize,
          50 // 0.5% slippage
        );

        if (!route) {
          continue;
        }

        const inputAmount = parseInt(route.inAmount);
        const outputAmount = parseInt(route.outAmount);
        const profit = this.jupiter.calculateProfit(inputAmount, outputAmount);

        if (profit >= this.minProfitPercent) {
          opportunities.push({
            pair: pair.name,
            inputMint: pair.input,
            outputMint: pair.output,
            inputAmount,
            expectedOutput: outputAmount,
            profitPercentage: profit,
            route,
            timestamp: Date.now(),
          });

          console.log(`\nOPPORTUNITY FOUND!`);
          console.log(`Pair: ${pair.name}`);
          console.log(`Profit: ${profit.toFixed(4)}%`);
          console.log(`Input: ${(inputAmount / LAMPORTS_PER_SOL).toFixed(6)}`);
          console.log(`Output: ${(outputAmount / LAMPORTS_PER_SOL).toFixed(6)}`);
        }
      } catch (error) {
        // Silent fail, continue scanning
        continue;
      }

      // Rate limit to avoid API throttling
      await this.sleep(200);
    }

    return opportunities;
  }

  /**
   * Calculate adaptive slippage based on profit
   * From research: higher profit = can afford higher slippage
   */
  calculateAdaptiveSlippage(profitPercent: number): number {
    if (profitPercent >= 2.0) return 100; // 1%
    if (profitPercent >= 1.0) return 75; // 0.75%
    if (profitPercent >= 0.5) return 50; // 0.5%
    return 30; // 0.3%
  }

  /**
   * Continuous scanning loop
   */
  async startScanning(intervalMs: number = 5000): Promise<void> {
    console.log(`\nStarting continuous arbitrage scanning...`);
    console.log(`Minimum profit: ${this.minProfitPercent}%`);
    console.log(`Trade size: ${this.tradeSize / LAMPORTS_PER_SOL} SOL`);
    console.log(`Interval: ${intervalMs}ms\n`);

    while (true) {
      try {
        const opportunities = await this.scanOpportunities();

        if (opportunities.length > 0) {
          console.log(`\nFound ${opportunities.length} opportunities!`);
          // Return opportunities for execution
          return;
        } else {
          console.log(`No opportunities found. Scanning again in ${intervalMs / 1000}s...`);
        }
      } catch (error) {
        console.error('Scanning error:', error);
      }

      await this.sleep(intervalMs);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
