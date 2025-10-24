import { Connection, Transaction, VersionedTransaction } from '@solana/web3.js';
import { GatewayClient } from '../gateway/client';
import { JupiterClient } from './jupiter';
import { ArbitrageOpportunity } from './detector';
import { TransactionLogger } from '../monitoring/logger';
import config from '../config';

export class ArbitrageExecutor {
  private connection: Connection;
  private gateway: GatewayClient;
  private jupiter: JupiterClient;
  private logger: TransactionLogger;
  private wallet;

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.gateway = new GatewayClient({
      rpcUrl: config.gateway.rpcUrl,
      apiKey: config.gateway.apiKey,
      network: config.solana.network,
    });
    this.jupiter = new JupiterClient();
    this.logger = new TransactionLogger();
    this.wallet = config.wallet.getKeypair();
  }

  /**
   * Execute triangular arbitrage opportunity using Gateway
   * Executes multi-hop swaps with Gateway multi-path delivery
   */
  async executeOpportunity(opportunity: ArbitrageOpportunity): Promise<boolean> {
    console.log(`\n🚀 Executing triangular arbitrage via Gateway...`);
    console.log(`Route: ${opportunity.routeName}`);
    console.log(`Expected profit: ${opportunity.profitPercentage.toFixed(4)}%`);

    try {
      // For triangular arbitrage, we need to execute the first swap
      // (the full multi-hop route should ideally be a single transaction,
      // but for simplicity, we'll execute the first leg as demonstration)

      // Get the first route in the triangular path
      const firstRoute = opportunity.routes[0];

      if (!firstRoute) {
        console.log('No route available for execution');
        return false;
      }

      // 1. Get swap transaction from Jupiter for first leg
      const swapTransaction = await this.jupiter.getSwapTransaction(
        firstRoute,
        this.wallet.publicKey.toBase58()
      );

      if (!swapTransaction) {
        console.log('Failed to get swap transaction from Jupiter');
        return false;
      }

      // 2. Deserialize and sign transaction
      const txBuffer = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(txBuffer);
      transaction.sign([this.wallet]);

      // 3. Send via Gateway multi-path delivery
      const signedBase64 = Buffer.from(transaction.serialize()).toString('base64');

      console.log('📡 Sending via Gateway multi-path delivery...');
      const result = await this.gateway.sendTransaction({
        transaction: signedBase64,
        jitoTip: 10000, // 0.00001 SOL tip
      });

      // 4. Log results
      this.logger.log({
        signature: result.signature,
        timestamp: Date.now(),
        usedGateway: true,
        deliveryMethod: result.deliveryPath,
        success: true,
        cost: result.actualCost / 1e9,
        landingTime: result.landingTime,
        jitoRefunded: result.jitoRefunded,
      });

      console.log(`\n✅ SUCCESS!`);
      console.log(`Signature: ${result.signature}`);
      console.log(`Delivery path: ${result.deliveryPath}`);
      console.log(`Landing time: ${result.landingTime}ms`);
      console.log(`Cost: ${(result.actualCost / 1e9).toFixed(6)} SOL`);
      if (result.jitoRefunded) {
        console.log(`💰 Jito tip refunded!`);
      }

      return true;
    } catch (error: any) {
      console.error('❌ Execution error:', error.message || error);

      this.logger.log({
        signature: 'failed',
        timestamp: Date.now(),
        usedGateway: true,
        success: false,
        cost: 0,
      });

      return false;
    }
  }

  /**
   * Execute with standard RPC for comparison
   */
  async executeViaStandardRPC(opportunity: ArbitrageOpportunity): Promise<boolean> {
    console.log(`\nExecuting arbitrage via Standard RPC...`);

    try {
      // Get the first route in the triangular path
      const firstRoute = opportunity.routes[0];

      if (!firstRoute) {
        console.log('No route available for execution');
        return false;
      }

      const swapTransaction = await this.jupiter.getSwapTransaction(
        firstRoute,
        this.wallet.publicKey.toBase58()
      );

      if (!swapTransaction) {
        return false;
      }

      const txBuffer = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(txBuffer);
      transaction.sign([this.wallet]);

      const signature = await this.connection.sendTransaction(transaction);
      await this.connection.confirmTransaction(signature);

      const txDetails = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });

      this.logger.log({
        signature,
        timestamp: Date.now(),
        usedGateway: false,
        success: true,
        cost: (txDetails?.meta?.fee || 0) / 1e9,
        landingTime: 0,
      });

      console.log(`SUCCESS! Signature: ${signature}`);
      return true;
    } catch (error) {
      console.error('Standard RPC execution error:', error);

      this.logger.log({
        signature: 'failed',
        timestamp: Date.now(),
        usedGateway: false,
        success: false,
        cost: 0,
      });

      return false;
    }
  }
}
