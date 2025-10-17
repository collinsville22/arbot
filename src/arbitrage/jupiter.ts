import axios from 'axios';
import { PublicKey } from '@solana/web3.js';

const JUPITER_API = 'https://quote-api.jup.ag/v6';

export interface JupiterRoute {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  priceImpactPct: number;
  marketInfos: any[];
  amount: string;
  slippageBps: number;
  otherAmountThreshold: string;
  swapMode: string;
  fees: any;
}

export interface JupiterQuoteResponse {
  data: JupiterRoute[];
  timeTaken: number;
}

export class JupiterClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = JUPITER_API;
  }

  /**
   * Get best route for swap from Jupiter
   * Based on LaneOlsons implementation - proven to work
   */
  async getRoute(
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 50
  ): Promise<JupiterRoute | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/quote`, {
        params: {
          inputMint,
          outputMint,
          amount,
          slippageBps,
          onlyDirectRoutes: false,
          maxAccounts: 64,
        },
      });

      if (!response.data) {
        return null;
      }

      return response.data;
    } catch (error) {
      console.error('Jupiter quote error:', error);
      return null;
    }
  }

  /**
   * Get swap transaction from Jupiter
   */
  async getSwapTransaction(
    route: JupiterRoute,
    userPublicKey: string
  ): Promise<string | null> {
    try {
      const response = await axios.post(`${this.baseUrl}/swap`, {
        quoteResponse: route,
        userPublicKey,
        wrapAndUnwrapSol: true,
        computeUnitPriceMicroLamports: 'auto',
      });

      return response.data.swapTransaction;
    } catch (error) {
      console.error('Jupiter swap transaction error:', error);
      return null;
    }
  }

  /**
   * Calculate profit percentage from route
   * Formula from research: ((output - input) / input) * 100
   */
  calculateProfit(inputAmount: number, outputAmount: number): number {
    return ((outputAmount - inputAmount) / inputAmount) * 100;
  }
}

/**
 * Common Solana token mints
 */
export const TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
};

/**
 * Popular arbitrage pairs (based on research)
 */
export const ARBITRAGE_PAIRS = [
  { input: TOKENS.SOL, output: TOKENS.USDC, name: 'SOL/USDC' },
  { input: TOKENS.USDC, output: TOKENS.SOL, name: 'USDC/SOL' },
  { input: TOKENS.SOL, output: TOKENS.USDT, name: 'SOL/USDT' },
  { input: TOKENS.USDT, output: TOKENS.SOL, name: 'USDT/SOL' },
  { input: TOKENS.USDC, output: TOKENS.USDT, name: 'USDC/USDT' },
  { input: TOKENS.USDT, output: TOKENS.USDC, name: 'USDT/USDC' },
];
