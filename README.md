<div align="center">

# 🏆 ArcWork

**Achievement · Invoice · Subscription — on Arc Network**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![Foundry](https://img.shields.io/badge/Foundry-v0.2-grey?logo=ethereum)](https://getfoundry.sh)
[![Arc Network](https://img.shields.io/badge/Arc-Network-00F0FF)](https://arc.network)

[Live Demo](https://arcwork-zeta.vercel.app) · [Contracts](https://testnet.arcscan.app) · [Report Bug](https://github.com/riyannode/arcwork/issues)

---

</div>

## ✨ Features

| Module | Description |
|--------|-------------|
| 🏆 **Achievement** | Soulbound NFT badges (ERC-5192) for on-chain actions |
| 💰 **Invoice** | Create USDC invoices, accept payments cross-chain, auto-settlement |
| 🔄 **Subscription** | Recurring USDC payments with auto-charge & cancel anytime |

## 📁 Structure

```
arcwork/
├── contracts/          # Solidity smart contracts (Foundry)
│   └── src/
│       ├── Achievement.sol      # Soulbound badge NFT
│       ├── Invoice.sol          # USDC invoice + escrow
│       └── Subscription.sol     # Recurring payments
└── frontend/           # Next.js 14 + Tailwind + wagmi
    └── src/
        ├── app/        # Pages (/, dashboard, achievements, invoice, subscription)
        ├── components/ # Navbar, Footer, WebGL Background
        └── lib/        # Contract ABIs & wallet config
```

## 🚀 Quick Start

### Smart Contracts

```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
forge build
forge test
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Open [http://localhost:3080](http://localhost:3080)

## 🌐 Arc Network

| Key | Value |
|-----|-------|
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | [testnet.arcscan.app](https://testnet.arcscan.app) |
| Faucet | [faucet.circle.com](https://faucet.circle.com) |
| USDC | `0x3600000000000000000000000000000000000000` |

**Why Arc?**
- ⛽ USDC as gas (no ETH needed)
- ⚡ Sub-second finality
- 🔗 EVM compatible
- 🔒 Opt-in privacy
- 🌉 Cross-chain USDC via CCTP

## 📊 Deployed Contracts

| Contract | Address |
|----------|---------|
| Achievement | [`0x52138F4C77e53805CaaeD0D2e39292EC312C8440`](https://testnet.arcscan.app/address/0x52138F4C77e53805CaaeD0D2e39292EC312C8440) |
| Invoice | [`0x1Eb2Ed241Cb978f4BF02DA68E128D50AD7A53Fbf`](https://testnet.arcscan.app/address/0x1Eb2Ed241Cb978f4BF02DA68E128D50AD7A53Fbf) |
| Subscription | [`0x01028Ca35bE5c3dcE85F661C6528138bc3Ad9Fc1`](https://testnet.arcscan.app/address/0x01028Ca35bE5c3dcE85F661C6528138bc3Ad9Fc1) |

## 💡 Revenue Model

- **Achievement:** Premium badges ($5–50)
- **Invoice:** 0.5% per invoice
- **Subscription:** 1–2% per payment

## 🔗 Links

- [Arc Network](https://arc.network)
- [Arc Docs](https://docs.arc.network)
- [Circle Faucet](https://faucet.circle.com)

---

<div align="center">

**Built on [Arc Network](https://arc.network) by [Circle](https://circle.com)**

</div>
