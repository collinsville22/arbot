import { Transaction, VersionedTransaction } from '@solana/web3.js';

export interface GatewayConfig {
  rpcUrl: string;
  apiKey?: string;
  network: 'mainnet-beta' | 'devnet' | 'testnet';
}

export interface OptimizeTransactionParams {
  transaction: string; // Base64 encoded transaction
  cuPrice?: number; // Priority fee in microlamports
  enabledDeliveryMethods?: DeliveryMethod[];
  expireInSlot?: number;
}

export type DeliveryMethod = 'rpc' | 'jito' | 'triton' | 'paladin' | 'nozomi';

export interface OptimizeTransactionResponse {
  optimizedTransaction: string; // Base64 encoded optimized transaction
  computeUnits: number;
  priorityFee: number;
  estimatedCost: number;
}

export interface SendTransactionParams {
  transaction: string; // Base64 encoded signed transaction
  enabledDeliveryMethods?: DeliveryMethod[];
  jitoTip?: number; // Tip amount in lamports
  deliveryDelay?: number; // Delay between delivery methods in ms
}

export interface SendTransactionResponse {
  signature: string;
  deliveryPath: DeliveryMethod; // Which method successfully delivered
  landingTime: number; // Time taken to land in ms
  actualCost: number; // Actual cost paid
  jitoRefunded: boolean; // Whether Jito tip was refunded
}

export interface TransactionMetrics {
  signature: string;
  timestamp: number;
  usedGateway: boolean;
  deliveryMethod?: DeliveryMethod;
  success: boolean;
  cost: number;
  landingTime?: number;
  jitoRefunded?: boolean;
}
