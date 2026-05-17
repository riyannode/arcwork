# ArcLayer Reviewer Notes

ArcLayer is a protocol layer for the agentic economy. This submission focuses on Arc testnet + Circle x402/Gateway payment rails for agent-to-agent commerce.

## Live endpoints

- Production app: https://arclayers.xyz
- Chain: Arc testnet (`chainId: 5042002`)
- RPC: `https://rpc.drpc.testnet.arc.network`
- Explorer: `https://testnet.arcscan.app`

## Verified deployed contracts

### Core agent work stack

- AgentRegistry: `0x9fe05d64F18DF8071636e725899e4B7fb2bDDC21`
- JobEscrow: `0xF0E1B72A127BfB82C618D5e0E9474cD420b7D225`
- WorkProof: `0xf4c4b3D334562141A74Bf6b7633B1E5c8D0DFEb5`
- ReputationOracle: `0x4D32725CFa2cEda855D948348d7000606a0fdB8c`

### A2A / marketplace stack

- A2AAgentRegistry: `0xB2639c76124DB56E3Ef74d4BB6730068d8a3703C`
- A2AReputationRegistry: `0x9c97b79ba9CF65E21628e5AEa7c38f2694c7F1Cc`
- A2AReceiptRegistry: `0x5F59b08167288683B1650D38a0f703548Bce97B7`
- MarketMirrorRegistry: `0xec59c6c499339BF4B8817D2154D905Bc30653195`
- Ignia token: `0xd669097dED179C4F8296Ce98D4b5b7317B882916`
- AgentRegistryV2: `0x0465d5B5539Df3da58253E360bcf36B2B016Db58`

## Circle / x402 integration notes

ArcLayer supports two payment paths:

1. **Circle Gateway-style x402 path**
   - Uses `PAYMENT-SIGNATURE` header.
   - `/api/x402/verify` verifies and returns payment receipt metadata.
   - `/api/x402/settle` can return HTTP `202` when Gateway settlement is accepted but still pending.
   - `X402_REQUIRE_SETTLEMENT=true` enables strict production mode: `/api/agents/[id]/run` requires settled Gateway receipts before execution.

2. **Arc-native EIP-3009 demo path**
   - Uses `X-PAYMENT` header.
   - Supports local demo flows without forcing live Gateway settlement.
   - This path is intentionally preserved for reviewer demos and local testing.

## Important environment flags

- `AGENT_REGISTRY_FROM_BLOCK`
  - Default: `41752050`
  - Used by `/api/a2a/agents` to avoid freetier RPC `getLogs` block-range limits.

- `AGENT_REGISTRY_MAX_RANGE`
  - Default: `10000`
  - Max chunk size for RPC log scans.

- `X402_REQUIRE_SETTLEMENT`
  - Default unset/false: demo-friendly mode.
  - `true`: strict production gate, requires Gateway receipts to be settled before agent execution.

- `X402_FACILITATOR_ENABLED`
  - `false`: disables x402 facilitator enforcement for demo/offline mode.

## Known reviewer-safe limitations

- Rate limiting is currently in-process memory. This is acceptable for single-instance demo deployment, but distributed production should use a shared store such as Upstash Redis or Vercel KV.
- Contract-level v1.1 items are documented in `ROADMAP.md` and intentionally not changed in this submission to avoid redeploy risk.
- Browser automation testing was unavailable in this environment; API/build/test verification was used instead.

## Verification performed

The patch set was verified with:

```bash
pnpm --filter @arclayer/sdk build
pnpm --filter @arclayer/console test
pnpm --filter @arclayer/console build
cd contracts && forge test
```

Expected status at submission time:

- SDK build: pass
- Console test suite: `77 passed`
- Console build: pass
- Foundry tests: `25 passed`
