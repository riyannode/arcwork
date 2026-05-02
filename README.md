# ArcWork 🏆💰🔄

**Achievement + Invoice + Subscription Platform on Arc Network**

## 🚀 Features

### 🏆 Achievement System
- Soulbound NFT badges (ERC-5192)
- Earn badges for on-chain actions
- Achievement showcase
- Progress tracking

### 💰 Invoice System
- Create USDC invoices
- Accept payments from any chain
- Auto-settlement on Arc
- 0.5% platform fee

### 🔄 Subscription Billing
- Recurring USDC payments
- Monthly/Yearly intervals
- Auto-charge via keeper
- Cancel anytime

## 📁 Project Structure

```
arcwork/
├── contracts/
│   └── src/
│       ├── Achievement.sol    # Soulbound badge NFT
│       ├── Invoice.sol        # USDC invoice + escrow
│       └── Subscription.sol   # Recurring payments
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx           # Landing page
│       │   ├── dashboard/page.tsx # Dashboard
│       │   ├── achievements/page.tsx
│       │   ├── invoice/page.tsx
│       │   └── subscription/page.tsx
│       ├── components/
│       │   ├── Navbar.tsx
│       │   ├── Footer.tsx
│       │   ├── AchievementCard.tsx
│       │   ├── InvoiceCard.tsx
│       │   └── SubscriptionCard.tsx
│       └── lib/
│           ├── contracts.ts   # Contract ABIs
│           └── wagmi.ts       # Wallet config
└── README.md
```

## 🔧 Setup

### Smart Contracts (Foundry)
```bash
cd contracts
forge install OpenZeppelin/openzeppelin-contracts
forge build
forge test
forge create src/Achievement.sol:Achievement --rpc-url https://rpc.testnet.arc.network --private-key $PRIVATE_KEY
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Arc Network

- **Chain ID:** 5042002
- **RPC:** https://rpc.testnet.arc.network
- **Explorer:** https://testnet.arcscan.app
- **Faucet:** https://faucet.circle.com
- **USDC:** 0x3600000000000000000000000000000000000000

## 💡 Why Arc?

- ✅ USDC as gas (no ETH needed)
- ✅ Sub-second finality
- ✅ EVM compatible
- ✅ Opt-in privacy
- ✅ Cross-chain USDC (CCTP)

## 📊 Revenue Model

- Achievement: Premium badges ($5-50)
- Invoice: 0.5% per invoice
- Subscription: 1-2% per payment

## 🔗 Links

- [Arc Network](https://arc.network)
- [Arc Docs](https://docs.arc.network)
- [Circle Faucet](https://faucet.circle.com)
