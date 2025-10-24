# Sanctum Gateway Arbitrage Bot

A Solana arbitrage bot that uses Sanctum Gateway's multi-path transaction delivery to execute triangular arbitrage trades via Jupiter.

## What This Does

This bot scans for triangular arbitrage opportunities on Solana (e.g., SOL → USDC → USDT → SOL) and executes profitable trades through Sanctum Gateway's simultaneous routing system.

Instead of choosing between regular RPC, Jito, Triton, or Paladin, Gateway sends your transaction through all of them at once. Whichever lands first wins, and you get refunded the Jito tip if regular RPC succeeded.

## Setup

**Requirements:**
- Node.js 18+
- A Solana wallet with some SOL
- Gateway API key from [gateway.sanctum.so](https://gateway.sanctum.so)

**Install:**
```bash
git clone https://github.com/collinsville22/arbot.git
cd arbot
npm install
```

**Configure:**
```bash
cp .env.example .env
```

Edit `.env` and set:
- `GATEWAY_API_KEY` - Your Gateway API key
- `PRIVATE_KEY` - Your wallet's private key (base58 encoded)
- `SOLANA_NETWORK` - Use `devnet` for testing, `mainnet-beta` for real trading
- `MIN_PROFIT_SOL` - Minimum profit percentage to execute trades (default: 0.01%)
- `POSITION_SIZE_SOL` - How much SOL to use per trade (default: 0.1)

**Run:**
```bash
npm run dev
```

## How It Works

1. **Scan for opportunities** - Checks 6 predefined triangular routes using Jupiter's quote API
2. **Calculate profit** - Simulates the full route: if you start with X SOL, do you end with more than X SOL?
3. **Execute via Gateway** - If profitable, sends the transaction through Gateway's multi-path delivery
4. **Track results** - Logs which delivery method succeeded, cost, and latency

## Arbitrage Routes

The bot currently scans these circular routes:

- SOL → USDC → USDT → SOL
- SOL → USDT → USDC → SOL
- SOL → USDC → BONK → SOL
- SOL → USDC → JUP → SOL
- USDC → SOL → USDT → USDC
- USDC → USDT → SOL → USDC

You can add more routes in `src/arbitrage/jupiter.ts`.

## Testing

**Start on devnet:**
1. Set `SOLANA_NETWORK=devnet` in `.env`
2. Get free devnet SOL from https://faucet.solana.com
3. Run `npm run dev`

The bot will scan for opportunities but won't lose real money.

**Move to mainnet:**
1. Change `SOLANA_NETWORK=mainnet-beta`
2. Make sure your wallet has SOL
3. Start with small `POSITION_SIZE_SOL` (like 0.01)
4. Increase `MIN_PROFIT_SOL` to 1.0% or higher initially

## What Gets Logged

Every transaction logs:
- Transaction signature
- Which delivery path succeeded (RPC/Jito/Triton/Paladin)
- Transaction cost
- Landing time
- Whether Jito tip was refunded

After running, you get a summary comparing Gateway vs standard RPC performance.

## Important Notes

**On profitability:**
Real arbitrage opportunities are rare. Most scans will find nothing. This is normal. The bot only executes when it finds genuine profit after simulating the full route.

**On Gateway:**
This project specifically showcases Sanctum Gateway's multi-path delivery. The core value is higher transaction success rates and potential cost savings from Jito refunds, not magic arbitrage alpha.

**On risk:**
You can lose money. Slippage, fees, and failed transactions happen. Start small and test thoroughly on devnet first.

## Project Structure

```
src/
├── arbitrage/
│   ├── detector.ts     # Scans Jupiter for triangular arbitrage
│   ├── executor.ts     # Executes trades via Gateway
│   └── jupiter.ts      # Jupiter V6 API integration
├── gateway/
│   ├── client.ts       # Gateway API client
│   └── types.ts        # Type definitions
├── monitoring/
│   └── logger.ts       # Transaction logging
├── config.ts           # Configuration loader
└── index.ts            # Main entry point
```

## Common Issues

**"GATEWAY_API_KEY not set"**
Get one from https://gateway.sanctum.so and add to `.env`

**"Insufficient balance"**
Your wallet needs SOL. For devnet use the faucet, for mainnet send SOL from an exchange.

**"No opportunities found"**
This is expected. Arbitrage is competitive. Lower `MIN_PROFIT_SOL` carefully if you want to see more opportunities, but know that lower profit = higher risk of losing money after fees.

## Building

```bash
npm run build    # Compile TypeScript
npm start        # Run compiled version
```

## License

MIT

## Resources

- [Sanctum Gateway](https://gateway.sanctum.so)
- [Jupiter Aggregator](https://jup.ag)
- [Solana Docs](https://docs.solana.com)
