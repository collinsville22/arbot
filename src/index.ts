import { Connection, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { GatewayClient } from './gateway/client';
import { TransactionLogger } from './monitoring/logger';
import config from './config';

/**
 * Sanctum Gateway Arbitrage Bot
 * Demonstrates Gateway's multi-path delivery and cost optimization
 */
class GatewayArbitrageBot {
  private connection: Connection;
  private gatewayClient: GatewayClient;
  private logger: TransactionLogger;
  private wallet;

  constructor() {
    this.connection = new Connection(config.solana.rpcUrl, 'confirmed');
    this.gatewayClient = new GatewayClient({
      rpcUrl: config.gateway.rpcUrl,
      apiKey: config.gateway.apiKey,
      network: config.solana.network,
    });
    this.logger = new TransactionLogger();
    this.wallet = config.wallet.getKeypair();

    console.log(`
╔════════════════════════════════════════════════════════╗
║      SANCTUM GATEWAY ARBITRAGE BOT INITIALIZED         ║
╚════════════════════════════════════════════════════════╝

Wallet: ${this.wallet.publicKey.toBase58()}
Network: ${config.solana.network}
Gateway: ${config.gateway.rpcUrl}
    `);
  }

  /**
   * Send a test transaction via Gateway
   */
  async sendViaGateway(): Promise<void> {
    console.log('\n🌉 Sending transaction via Sanctum Gateway...\n');

    try {
      const startTime = Date.now();

      // Create a simple transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.wallet.publicKey,
          toPubkey: this.wallet.publicKey, // Self-transfer for testing
          lamports: 1, // 1 lamport
        })
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.wallet.publicKey;

      // Serialize transaction
      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      });
      const base64Transaction = serialized.toString('base64');

      // 1. Optimize transaction via Gateway
      console.log('⚙️  Optimizing transaction...');
      const optimized = await this.gatewayClient.optimizeTransaction({
        transaction: base64Transaction,
      });
      console.log(`   Compute Units: ${optimized.computeUnits}`);
      console.log(`   Priority Fee: ${optimized.priorityFee} microlamports`);

      // Sign the transaction
      transaction.sign(this.wallet);
      const signedSerialized = transaction.serialize();
      const signedBase64 = signedSerialized.toString('base64');

      // 2. Send via Gateway's multi-path delivery
      console.log('🚀 Sending via multi-path delivery...');
      const result = await this.gatewayClient.sendTransaction({
        transaction: signedBase64,
        jitoTip: 10000, // 0.00001 SOL tip
      });

      const totalTime = Date.now() - startTime;

      // Log metrics
      this.logger.log({
        signature: result.signature,
        timestamp: Date.now(),
        usedGateway: true,
        deliveryMethod: result.deliveryPath,
        success: true,
        cost: result.actualCost / LAMPORTS_PER_SOL,
        landingTime: result.landingTime,
        jitoRefunded: result.jitoRefunded,
      });

      console.log(`\n✅ Transaction successful!`);
      console.log(`   Signature: ${result.signature}`);
      console.log(`   Delivery Path: ${result.deliveryPath}`);
      console.log(`   Total Time: ${totalTime}ms`);
      if (result.jitoRefunded) {
        console.log(`   💰 Jito tip was refunded!`);
      }
    } catch (error) {
      console.error('❌ Gateway transaction failed:', error);
      this.logger.log({
        signature: 'failed',
        timestamp: Date.now(),
        usedGateway: true,
        success: false,
        cost: 0,
      });
    }
  }

  /**
   * Send a test transaction via standard RPC (for comparison)
   */
  async sendViaStandardRPC(): Promise<void> {
    console.log('\n📡 Sending transaction via Standard RPC...\n');

    try {
      const startTime = Date.now();

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: this.wallet.publicKey,
          toPubkey: this.wallet.publicKey,
          lamports: 1,
        })
      );

      const signature = await this.connection.sendTransaction(transaction, [
        this.wallet,
      ]);

      await this.connection.confirmTransaction(signature);

      const totalTime = Date.now() - startTime;

      // Get transaction details for cost
      const txDetails = await this.connection.getTransaction(signature, {
        maxSupportedTransactionVersion: 0,
      });
      const fee = txDetails?.meta?.fee || 0;

      this.logger.log({
        signature,
        timestamp: Date.now(),
        usedGateway: false,
        success: true,
        cost: fee / LAMPORTS_PER_SOL,
        landingTime: totalTime,
      });

      console.log(`✅ Transaction successful!`);
      console.log(`   Signature: ${signature}`);
      console.log(`   Total Time: ${totalTime}ms`);
    } catch (error) {
      console.error('❌ Standard RPC transaction failed:', error);
      this.logger.log({
        signature: 'failed',
        timestamp: Date.now(),
        usedGateway: false,
        success: false,
        cost: 0,
      });
    }
  }

  /**
   * Run comparison test
   */
  async runComparison(iterations: number = 5): Promise<void> {
    console.log(`\n🔬 Running ${iterations} iterations of Gateway vs Standard RPC...\n`);

    for (let i = 0; i < iterations; i++) {
      console.log(`\n[${ i + 1}/${iterations}] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

      await this.sendViaGateway();
      await new Promise((resolve) => setTimeout(resolve, 2000));

      await this.sendViaStandardRPC();
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Print final statistics
    this.logger.printFinalStats();
  }

  async checkBalance(): Promise<void> {
    const balance = await this.connection.getBalance(this.wallet.publicKey);
    console.log(`\nWallet Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
  }
}

// Main execution
async function main() {
  const bot = new GatewayArbitrageBot();

  await bot.checkBalance();

  // Run comparison test
  await bot.runComparison(3);

  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
