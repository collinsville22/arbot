import dotenv from 'dotenv';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

dotenv.config();

export const config = {
  // Solana Configuration
  solana: {
    rpcUrl: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    network: (process.env.SOLANA_NETWORK || 'mainnet-beta') as 'mainnet-beta' | 'devnet' | 'testnet',
  },

  // Sanctum Gateway Configuration
  gateway: {
    rpcUrl: process.env.GATEWAY_RPC_URL || 'https://gateway.sanctum.so/v1/rpc',
    apiKey: process.env.GATEWAY_API_KEY,
  },

  // Wallet Configuration
  wallet: {
    getKeypair: (): Keypair => {
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('PRIVATE_KEY not set in .env file');
      }
      try {
        return Keypair.fromSecretKey(bs58.decode(privateKey));
      } catch (error) {
        throw new Error('Invalid PRIVATE_KEY format. Must be base58 encoded.');
      }
    },
  },

  // Trading Parameters
  trading: {
    minProfitSol: parseFloat(process.env.MIN_PROFIT_SOL || '0.01'),
    maxSlippageBps: parseInt(process.env.MAX_SLIPPAGE_BPS || '50'),
    positionSizeSol: parseFloat(process.env.POSITION_SIZE_SOL || '0.1'),
  },

  // Monitoring
  monitoring: {
    enableDashboard: process.env.ENABLE_DASHBOARD === 'true',
    dashboardPort: parseInt(process.env.DASHBOARD_PORT || '3000'),
  },
};

// Validation
if (!process.env.GATEWAY_API_KEY && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: GATEWAY_API_KEY not set. Gateway features may not work.');
}

export default config;
