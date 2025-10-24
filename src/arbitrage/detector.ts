import { JupiterClient, ARBITRAGE_ROUTES, JupiterRoute } from './jupiter';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface ArbitrageOpportunity {
  routeName: string;
  startToken: string;
  intermediateTokens: string[];
  inputAmount: number;
  expectedOutput: number;
  profitPercentage: number;
  routes: JupiterRoute[];
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
   * Scan for triangular arbitrage opportunities
   * Finds circular routes where you end up with more of the starting token
   */
  async scanOpportunities(): Promise<ArbitrageOpportunity[]> {
    const opportunities: ArbitrageOpportunity[] = [];

    console.log(`\nScanning ${ARBITRAGE_ROUTES.length} triangular routes for arbitrage...`);

    for (const arbRoute of ARBITRAGE_ROUTES) {
      try {
        // Execute the triangular route simulation
        const result = await this.jupiter.executeTriangularRoute(
          arbRoute.startToken,
          arbRoute.intermediateTokens,
          this.tradeSize,
          50 // 0.5% slippage
        );

        if (!result) {
          continue;
        }

        // Calculate profit: did we end up with more of the starting token?
        const profit = this.jupiter.calculateCircularProfit(
          this.tradeSize,
          result.finalAmount
        );

        if (profit >= this.minProfitPercent) {
          opportunities.push({
            routeName: arbRoute.name,
            startToken: arbRoute.startToken,
            intermediateTokens: arbRoute.intermediateTokens,
            inputAmount: this.tradeSize,
            expectedOutput: result.finalAmount,
            profitPercentage: profit,
            routes: result.routes,
            timestamp: Date.now(),
          });

          console.log(`\n✅ OPPORTUNITY FOUND!`);
          console.log(`Route: ${arbRoute.name}`);
          console.log(`Profit: ${profit.toFixed(4)}%`);
          console.log(`Input: ${(this.tradeSize / LAMPORTS_PER_SOL).toFixed(6)} (start token)`);
          console.log(`Output: ${(result.finalAmount / LAMPORTS_PER_SOL).toFixed(6)} (start token)`);
          console.log(`Net gain: ${((result.finalAmount - this.tradeSize) / LAMPORTS_PER_SOL).toFixed(6)}`);
        }
      } catch (error) {
        // Silent fail, continue scanning
        continue;
      }

      // Rate limit to avoid API throttling
      await this.sleep(300);
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
