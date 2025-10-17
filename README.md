# Sanctum Gateway Arbitrage Bot

A high-performance MEV/arbitrage bot demonstrating **Sanctum Gateway's** multi-path transaction delivery, cost optimization, and reliability during network congestion.

## 🏆 Sanctum Gateway Track Submission

This project showcases Gateway's core capabilities:
- **Multi-path delivery**: Simultaneous routing through RPC, Jito, Triton, Paladin
- **Cost optimization**: Automatic Jito tip refunds when transactions land via RPC
- **Reliability**: Higher success rates during network congestion
- **Real-time monitoring**: Dashboard showing transaction paths and performance

## Features

### Gateway Integration
- ✅ `optimizeTransaction` RPC for automatic compute unit calculation
- ✅ `sendTransaction` with multi-channel delivery
- ✅ Real-time transaction monitoring
- ✅ Cost comparison (Gateway vs standard RPC)

### Trading Engine
- Jupiter price feed integration
- Arbitrage opportunity detection
- Success rate tracking
- Performance analytics

### Monitoring Dashboard
- Live transaction status
- Delivery path visualization (which channel won)
- Cost savings tracker (Jito refunds)
- Success rate comparison

## Quick Start

### Local Development (No Build)
```bash
# Clone the repository
git clone <your-repo-url>
cd gateway-arbitrage-bot

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### GitHub Codespaces (Recommended for Building)
1. Push this repo to GitHub
2. Click **Code** → **Codespaces** → **Create codespace**
3. Wait for auto-setup (Solana CLI + dependencies install automatically)
4. Run:
```bash
npm install
npm run dev
```

## Setup

### 1. Get Sanctum Gateway Access
Visit [gateway.sanctum.so](https://gateway.sanctum.so) to get your API key

### 2. Configure Environment
Edit `.env` with:
- `GATEWAY_API_KEY`: Your Sanctum Gateway API key
- `PRIVATE_KEY`: Your Solana wallet private key (base58)
- Trading parameters (profit thresholds, position sizes)

### 3. Run the Bot
```bash
# Development mode with auto-reload
npm run dev

# Production build
npm run build
npm start

# Test Gateway integration only
npm run test

# Start monitoring dashboard
npm run monitor
```

## Project Structure

```
gateway-arbitrage-bot/
├── src/
│   ├── gateway/
│   │   ├── client.ts          # Gateway RPC client
│   │   ├── optimizer.ts       # Transaction optimization
│   │   └── types.ts           # TypeScript types
│   ├── arbitrage/
│   │   ├── detector.ts        # Opportunity detection
│   │   ├── executor.ts        # Trade execution
│   │   └── jupiter.ts         # Jupiter API integration
│   ├── monitoring/
│   │   ├── dashboard.ts       # Real-time dashboard
│   │   ├── metrics.ts         # Performance tracking
│   │   └── logger.ts          # Transaction logging
│   ├── config.ts              # Configuration
│   └── index.ts               # Main entry point
├── .devcontainer/             # Codespace auto-setup
└── package.json
```

## How It Works

### Transaction Flow
1. **Detect Opportunity**: Monitor Jupiter for arbitrage opportunities
2. **Optimize via Gateway**: Call `optimizeTransaction` to prepare transaction
3. **Multi-Path Delivery**: Send via Gateway's `sendTransaction` (RPC + Jito + Triton + Paladin)
4. **Monitor & Track**: Log which path succeeded and costs incurred
5. **Compare Performance**: Track success rates vs standard RPC

### Gateway Advantages Demonstrated
- **Higher Success Rate**: Multi-path increases landing probability during congestion
- **Cost Savings**: Jito tips refunded when RPC path succeeds first
- **No Code Changes**: Adjust delivery parameters via dashboard
- **Real-Time Visibility**: Monitor transaction status across all paths

## Demo Video

[Add your demo video link here]

## Submission Details

- **Project Name**: Sanctum Gateway Arbitrage Bot
- **Track**: Sanctum Gateway Track
- **Hackathon**: Solana Cypherpunk Hackathon 2025
- **GitHub**: [Your repo URL]
- **Demo**: [Demo video URL]

## Performance Metrics

### Success Rate Comparison
| Metric | Standard RPC | Sanctum Gateway | Improvement |
|--------|--------------|-----------------|-------------|
| Success Rate (Normal) | 95% | 98% | +3% |
| Success Rate (Congestion) | 60% | 89% | +48% |
| Average Latency | 2.3s | 1.8s | -22% |
| Cost per TX | 0.00015 SOL | 0.00012 SOL | -20% |

*Note: Add your actual metrics after testing*

## License

MIT

## Contact

- Twitter: [@your_handle]
- Telegram: @your_username
