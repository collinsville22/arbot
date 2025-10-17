import axios, { AxiosInstance } from 'axios';
import {
  GatewayConfig,
  OptimizeTransactionParams,
  OptimizeTransactionResponse,
  SendTransactionParams,
  SendTransactionResponse,
} from './types';

export class GatewayClient {
  private client: AxiosInstance;
  private config: GatewayConfig;

  constructor(config: GatewayConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.rpcUrl,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` }),
      },
      timeout: 30000,
    });
  }

  /**
   * Optimize transaction using Gateway's optimizeTransaction RPC method
   * - Auto-calculates compute units
   * - Sets optimal priority fees
   * - Finds address lookup tables
   */
  async optimizeTransaction(
    params: OptimizeTransactionParams
  ): Promise<OptimizeTransactionResponse> {
    const response = await this.client.post('', {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'optimizeTransaction',
      params: [
        params.transaction,
        {
          cuPrice: params.cuPrice,
          enabledDeliveryMethods: params.enabledDeliveryMethods || [
            'rpc',
            'jito',
            'triton',
            'paladin',
          ],
          ...(params.expireInSlot && { expireInSlot: params.expireInSlot }),
        },
      ],
    });

    if (response.data.error) {
      throw new Error(`Gateway optimize error: ${response.data.error.message}`);
    }

    return response.data.result;
  }

  /**
   * Send transaction using Gateway's multi-path delivery
   * - Routes simultaneously through RPC, Jito, Triton, Paladin
   * - Refunds Jito tip if RPC succeeds first
   * - Returns which path succeeded
   */
  async sendTransaction(
    params: SendTransactionParams
  ): Promise<SendTransactionResponse> {
    const startTime = Date.now();

    const response = await this.client.post('', {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'sendTransaction',
      params: [
        params.transaction,
        {
          encoding: 'base64',
          enabledDeliveryMethods: params.enabledDeliveryMethods || [
            'rpc',
            'jito',
            'triton',
            'paladin',
          ],
          ...(params.jitoTip && { jitoTip: params.jitoTip }),
          ...(params.deliveryDelay && { deliveryDelay: params.deliveryDelay }),
        },
      ],
    });

    if (response.data.error) {
      throw new Error(`Gateway send error: ${response.data.error.message}`);
    }

    const landingTime = Date.now() - startTime;

    return {
      signature: response.data.result.signature || response.data.result,
      deliveryPath: response.data.result.deliveryPath || 'unknown',
      landingTime,
      actualCost: response.data.result.actualCost || 0,
      jitoRefunded: response.data.result.jitoRefunded || false,
    };
  }

  /**
   * Get transaction status from Gateway dashboard
   */
  async getTransactionStatus(signature: string): Promise<any> {
    const response = await this.client.post('', {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'getTransaction',
      params: [signature, { encoding: 'jsonParsed' }],
    });

    return response.data.result;
  }
}
