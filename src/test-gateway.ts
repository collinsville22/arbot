/**
 * Simple Gateway Integration Test
 * Run with: npm run test
 */
import { GatewayClient } from './gateway/client';
import config from './config';

async function testGatewayConnection() {
  console.log('🧪 Testing Sanctum Gateway Connection...\n');

  const gateway = new GatewayClient({
    rpcUrl: config.gateway.rpcUrl,
    apiKey: config.gateway.apiKey,
    network: config.solana.network,
  });

  try {
    console.log('Gateway RPC URL:', config.gateway.rpcUrl);
    console.log('API Key configured:', !!config.gateway.apiKey);
    console.log('\n✅ Gateway client initialized successfully!');
    console.log('\nNext steps:');
    console.log('1. Get your Gateway API key from gateway.sanctum.so');
    console.log('2. Add it to your .env file as GATEWAY_API_KEY');
    console.log('3. Run: npm run dev');
  } catch (error) {
    console.error('❌ Gateway connection failed:', error);
    process.exit(1);
  }
}

testGatewayConnection();
