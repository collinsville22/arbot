import { TransactionMetrics } from '../gateway/types';
import fs from 'fs';
import path from 'path';

export class TransactionLogger {
  private logFile: string;
  private metrics: TransactionMetrics[] = [];

  constructor() {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logFile = path.join(logsDir, `transactions-${Date.now()}.json`);
  }

  log(metric: TransactionMetrics): void {
    this.metrics.push(metric);
    this.saveToFile();
    this.printSummary(metric);
  }

  private saveToFile(): void {
    fs.writeFileSync(this.logFile, JSON.stringify(this.metrics, null, 2));
  }

  private printSummary(metric: TransactionMetrics): void {
    const gatewayLabel = metric.usedGateway ? '🌉 Gateway' : '📡 Standard RPC';
    const statusLabel = metric.success ? '✅ SUCCESS' : '❌ FAILED';
    const refundLabel = metric.jitoRefunded ? '💰 Jito Refunded' : '';

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${statusLabel} ${gatewayLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Signature: ${metric.signature}
${metric.deliveryMethod ? `Delivery: ${metric.deliveryMethod.toUpperCase()}` : ''}
Cost: ${metric.cost.toFixed(6)} SOL
${metric.landingTime ? `Landing Time: ${metric.landingTime}ms` : ''}
${refundLabel}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }

  getStats(): {
    totalTransactions: number;
    gatewayTransactions: number;
    standardTransactions: number;
    gatewaySuccessRate: number;
    standardSuccessRate: number;
    avgGatewayCost: number;
    avgStandardCost: number;
    avgGatewayLatency: number;
    avgStandardLatency: number;
    jitoRefunds: number;
  } {
    const gatewayMetrics = this.metrics.filter((m) => m.usedGateway);
    const standardMetrics = this.metrics.filter((m) => !m.usedGateway);

    const gatewaySuccesses = gatewayMetrics.filter((m) => m.success).length;
    const standardSuccesses = standardMetrics.filter((m) => m.success).length;

    return {
      totalTransactions: this.metrics.length,
      gatewayTransactions: gatewayMetrics.length,
      standardTransactions: standardMetrics.length,
      gatewaySuccessRate:
        gatewayMetrics.length > 0
          ? (gatewaySuccesses / gatewayMetrics.length) * 100
          : 0,
      standardSuccessRate:
        standardMetrics.length > 0
          ? (standardSuccesses / standardMetrics.length) * 100
          : 0,
      avgGatewayCost:
        gatewayMetrics.reduce((sum, m) => sum + m.cost, 0) /
          gatewayMetrics.length || 0,
      avgStandardCost:
        standardMetrics.reduce((sum, m) => sum + m.cost, 0) /
          standardMetrics.length || 0,
      avgGatewayLatency:
        gatewayMetrics.reduce((sum, m) => sum + (m.landingTime || 0), 0) /
          gatewayMetrics.length || 0,
      avgStandardLatency:
        standardMetrics.reduce((sum, m) => sum + (m.landingTime || 0), 0) /
          standardMetrics.length || 0,
      jitoRefunds: gatewayMetrics.filter((m) => m.jitoRefunded).length,
    };
  }

  printFinalStats(): void {
    const stats = this.getStats();

    console.log(`
╔════════════════════════════════════════════════════════╗
║          SANCTUM GATEWAY PERFORMANCE REPORT            ║
╚════════════════════════════════════════════════════════╝

Total Transactions: ${stats.totalTransactions}

┌─────────────────────────────────────────────────────┐
│ SUCCESS RATES                                        │
├─────────────────────────────────────────────────────┤
│ Gateway:        ${stats.gatewaySuccessRate.toFixed(1)}% (${stats.gatewayTransactions} txs) │
│ Standard RPC:   ${stats.standardSuccessRate.toFixed(1)}% (${stats.standardTransactions} txs) │
│ Improvement:    +${(stats.gatewaySuccessRate - stats.standardSuccessRate).toFixed(1)}%                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ COST ANALYSIS                                        │
├─────────────────────────────────────────────────────┤
│ Gateway Avg:    ${stats.avgGatewayCost.toFixed(6)} SOL           │
│ Standard Avg:   ${stats.avgStandardCost.toFixed(6)} SOL           │
│ Savings:        ${((stats.avgStandardCost - stats.avgGatewayCost) * 100 / stats.avgStandardCost).toFixed(1)}%                    │
│ Jito Refunds:   ${stats.jitoRefunds} times                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ LATENCY                                              │
├─────────────────────────────────────────────────────┤
│ Gateway Avg:    ${stats.avgGatewayLatency.toFixed(0)}ms                   │
│ Standard Avg:   ${stats.avgStandardLatency.toFixed(0)}ms                   │
│ Improvement:    -${((stats.avgStandardLatency - stats.avgGatewayLatency) * 100 / stats.avgStandardLatency).toFixed(1)}%                    │
└─────────────────────────────────────────────────────┘

Log file: ${this.logFile}
    `);
  }
}
