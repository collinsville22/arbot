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
   * Get best route for swap from Jupiter V6
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
          amount: amount.toString(),
          slippageBps,
          onlyDirectRoutes: false,
        },
      });

      if (!response.data) {
        return null;
      }

      return response.data;
    } catch (error: any) {
      console.error('Jupiter API Error:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Get swap transaction from Jupiter V6
   * Returns base64 encoded transaction
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
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      });

      return response.data.swapTransaction;
    } catch (error) {
      console.error('Jupiter swap transaction error:', error);
      return null;
    }
  }

  /**
   * Calculate circular arbitrage profit
   * For routes that start and end with the same token (e.g., SOL → USDC → SOL)
   * Returns profit percentage based on same-token comparison
   */
  calculateCircularProfit(
    initialAmount: number,
    finalAmount: number
  ): number {
    return ((finalAmount - initialAmount) / initialAmount) * 100;
  }

  /**
   * Execute a multi-hop arbitrage route
   * Example: SOL → USDC → USDT → SOL
   * Returns the final amount in the starting token
   */
  async executeTriangularRoute(
    startToken: string,
    intermediateTokens: string[],
    amount: number,
    slippageBps: number = 50
  ): Promise<{ finalAmount: number; routes: JupiterRoute[] } | null> {
    try {
      const routes: JupiterRoute[] = [];
      let currentAmount = amount;
      let currentToken = startToken;

      // Build the circular route
      const routeTokens = [...intermediateTokens, startToken];

      for (const nextToken of routeTokens) {
        const route = await this.getRoute(
          currentToken,
          nextToken,
          Math.floor(currentAmount),
          slippageBps
        );

        if (!route) {
          return null;
        }

        routes.push(route);
        currentAmount = parseInt(route.outAmount);
        currentToken = nextToken;
      }

      return {
        finalAmount: currentAmount,
        routes,
      };
    } catch (error) {
      return null;
    }
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
  PYTH: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
};

/**
 * Triangular arbitrage routes
 * Each route starts and ends with the same token for true circular arbitrage
 * Format: Start → Token1 → Token2 → Start
 */
export const ARBITRAGE_ROUTES = [
  // SOL-based triangular routes
  {
    name: 'SOL → USDC → USDT → SOL',
    startToken: TOKENS.SOL,
    intermediateTokens: [TOKENS.USDC, TOKENS.USDT],
  },
  {
    name: 'SOL → USDT → USDC → SOL',
    startToken: TOKENS.SOL,
    intermediateTokens: [TOKENS.USDT, TOKENS.USDC],
  },
  {
    name: 'SOL → USDC → BONK → SOL',
    startToken: TOKENS.SOL,
    intermediateTokens: [TOKENS.USDC, TOKENS.BONK],
  },
  {
    name: 'SOL → USDC → JUP → SOL',
    startToken: TOKENS.SOL,
    intermediateTokens: [TOKENS.USDC, TOKENS.JUP],
  },

  // USDC-based triangular routes
  {
    name: 'USDC → SOL → USDT → USDC',
    startToken: TOKENS.USDC,
    intermediateTokens: [TOKENS.SOL, TOKENS.USDT],
  },
  {
    name: 'USDC → USDT → SOL → USDC',
    startToken: TOKENS.USDC,
    intermediateTokens: [TOKENS.USDT, TOKENS.SOL],
  },
];
