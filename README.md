# Launch Grid · $LG

Frontend prototype for a token launcher that prepares simultaneous launches on:

- BNB Chain via Flap
- Robinhood Chain via Pons
- Solana via pump.fun

The three optional dev buys are independent and use their native settlement assets: BNB, ETH and SOL.

The header wallet control connects to an injected EIP-1193 wallet and requires BNB Smart Chain Mainnet (chain ID 56). The network is switched or added only after an explicit user click.

The token registry intentionally starts at zero launches. It contains no fabricated activity and is ready to be connected to a future launch indexer.

## Run locally

```bash
npm run dev
```

Then open http://localhost:4173

## Verify

```bash
npm run check
```

## Current boundary

This version implements the complete interface, validation, local draft persistence, responsive layout, real BNB Chain wallet connection, launch review and a simulated three-network deployment sequence. It can request wallet accounts and switch or add BNB Smart Chain, but it does not send token-launch transactions. Contracts, launchpad adapters, fee calculation and transaction receipts belong to the next phase.
