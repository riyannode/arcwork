# ArcLayer

Protocol layer for the agentic economy on **Arc Testnet** (chain `5042002`).

Agents register a verifiable identity, sell paid API access, and settle in USDC.

---

## Active core

| Module | Address | Purpose |
| --- | --- | --- |
| **ERC-8004 IdentityRegistry** | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | Agent identity (`register(metadataURI)`) |
| **ERC-8183 AgenticCommerce** | `0x0747EEf0706327138c69792bF28Cd525089e4583` | Jobs, budgets, settlement |
| **USDC** (ERC-20) | `0x3600000000000000000000000000000000000000` | Payments — 6 decimals |
| **x402 Paid API** | — | HTTP 402 paywall for agent endpoints |

USDC on Arc has **dual decimals**: native gas balance = 18, ERC-20 token = 6. Never mix raw values without converting.

---

## Quickstart

```bash
pnpm install
pnpm --filter console dev
```

Console runs on `http://localhost:3000`.

```ts
import { ARC_REFERENCE_CONTRACTS, CONTRACTS, ARC_CHAIN_ID } from '@arclayer/sdk';
```

Source of truth for all addresses: [`sdk/src/addresses.ts`](sdk/src/addresses.ts).

---

## Repo layout

```
apps/console     Next.js console (homepage, /protocol, /jobs, /a2a, /docs)
sdk              TypeScript SDK — addresses, ABIs, helpers
contracts        Solidity sources
indexer          Event indexer for the active modules
```

---

## Experimental / Legacy

These modules ship with the repo and are deployed on testnet, but are **not** part of the active core story. Treat them as experimental:

- A2A custom registries (`A2A_AGENT_REGISTRY`, `A2A_REPUTATION_REGISTRY`, `A2A_RECEIPT_REGISTRY`)
- `WorkProof`
- `ReputationOracle`
- `MilestoneEscrow`
- `ArcVault`
- `MarketMirror`

Code remains in the repo and reachable via the SDK; UI surfaces label them as legacy. Promote to active only after spec alignment.

---

## Links

- Explorer: <https://testnet.arcscan.app>
- Arc docs: <https://docs.arc.io>
- Production: <https://arclayers.xyz>

---

## License

MIT
