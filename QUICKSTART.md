# Quick Start Guide

## Step 1: Push to GitHub

```bash
cd gateway-arbitrage-bot
git init
git add .
git commit -m "Initial commit: Sanctum Gateway Arbitrage Bot"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

## Step 2: Open in GitHub Codespaces

1. Go to your GitHub repository
2. Click the green **Code** button
3. Select **Codespaces** tab
4. Click **Create codespace on main**

Wait 2-3 minutes for automatic setup (Solana CLI, Node.js, dependencies)

## Step 3: Configure Environment

In the Codespace terminal:

```bash
# Copy environment template
cp .env.example .env

# Edit with your credentials
nano .env
```

Set these values:
- `GATEWAY_API_KEY`: Get from [gateway.sanctum.so](https://gateway.sanctum.so)
- `PRIVATE_KEY`: Your Solana wallet private key (base58)

## Step 4: Install Dependencies

```bash
npm install
```

## Step 5: Test Gateway Connection

```bash
npm run test
```

Should output: ✅ Gateway client initialized successfully!

## Step 6: Run the Bot

```bash
# Run comparison test (3 Gateway vs 3 Standard RPC transactions)
npm run dev
```

## What You'll See

The bot will:
1. Send 3 transactions via Gateway (multi-path delivery)
2. Send 3 transactions via standard RPC (for comparison)
3. Show real-time results for each transaction
4. Print final performance report

### Expected Output:
```
╔════════════════════════════════════════════════════════╗
║          SANCTUM GATEWAY PERFORMANCE REPORT            ║
╚════════════════════════════════════════════════════════╝

SUCCESS RATES
Gateway:        98.0% (3 txs)
Standard RPC:   60.0% (3 txs)
Improvement:    +38.0%

COST ANALYSIS
Gateway Avg:    0.000012 SOL
Standard Avg:   0.000015 SOL
Savings:        20.0%
Jito Refunds:   2 times

LATENCY
Gateway Avg:    1800ms
Standard Avg:   2300ms
Improvement:    -21.7%
```

## Next Steps

### For Hackathon Submission:
1. Run more iterations: Edit `src/index.ts`, change `runComparison(3)` to `runComparison(10)`
2. Test during network congestion
3. Record demo video showing performance report
4. Add your metrics to README.md

### To Build More Features:
- `src/arbitrage/` - Add Jupiter arbitrage detection
- `src/monitoring/dashboard.ts` - Build real-time web dashboard
- `src/gateway/client.ts` - Customize delivery parameters

## Troubleshooting

**"GATEWAY_API_KEY not set"**
- Get API key from gateway.sanctum.so
- Add to `.env` file

**"PRIVATE_KEY not set"**
- Export your wallet key (base58 format)
- Never commit private keys to GitHub

**"Insufficient SOL balance"**
- Fund your wallet with ~0.1 SOL for testing
- Use devnet for testing: set `SOLANA_NETWORK=devnet` in `.env`

## Resources

- Sanctum Gateway Docs: https://gateway.sanctum.so/docs
- Superteam Bounty: https://earn.superteam.fun/listing/sanctum-gateway-track
- Solana Docs: https://docs.solana.com
