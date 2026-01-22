# Yieldra - Yield-Powered Freelance Escrow on Stellar

## 💰 What is Yieldra?

**Yieldra** is the first yield-generating freelance payment platform built on Stellar blockchain. Unlike traditional escrow services where funds sit idle, Yieldra automatically invests escrowed funds into **Real World Assets (RWA)** like OUSG (tokenized US Treasury bonds) to generate **5% APY** while your project is in progress.

### Key Features

🔒 **Smart Escrow** - Milestone-based payments with blockchain security  
💎 **Automatic Yield** - Earn 5% APY on escrowed funds via OUSG  
🌍 **Multi-Currency** - Pay in XLM, USDC, or local currencies (INR, KES, NGN)  
⚡ **Instant Settlement** - No bank delays, near-zero fees  
🔐 **Trustless** - Smart contracts eliminate middleman risk  

---

## 🎨 Brand Identity

**Name**: Yieldra  
**Tagline**: *"Earn while you pay"*  
**Colors**: Dark theme with vibrant orange accents (#F97316)  
**Logo**: Shield with upward growth arrow - representing security + yield growth

---

## 🏗️ Architecture

Yieldra uses a three-layer smart contract system:

1. **Escrow Core** - Manages jobs, milestones, and payments
2. **Yield Harvester** - Automatically converts idle USDC → OUSG for yield generation
3. **Liquidity Router** - Multi-currency support via Stellar DEX

---

## 🚀 Quick Start

### Prerequisites
- [Freighter Wallet](https://www.freighter.app/) browser extension
- Stellar testnet account with XLM (get from [Friendbot](https://laboratory.stellar.org/#account-creator?network=test))
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/sukrit-89/Flowpay.git
cd Flowpay

# Install frontend dependencies
cd frontend
npm install

# Configure environment (optional - testnet contracts already configured)
cp .env.example .env

# Start development server
npm run dev
```

Visit http://localhost:3000

### ✨ New Features

- 🎨 **Modern Animated UI** - Smooth transitions with Framer Motion
- 💾 **Wallet Persistence** - Auto-reconnect on page reload
- 📊 **Live Statistics** - Animated counters and real-time updates
- 🎯 **Improved Navigation** - Sleek sidebar with role-based menus
- 🌈 **Gradient Effects** - Dynamic background animations
- 📱 **Responsive Design** - Optimized for all screen sizes

---

## 💡 How It Works

### For Clients

1. **Create Job** - Post project details, budget, and milestones
2. **Lock Funds** - Funds automatically deposited into yield-generating escrow
3. **Earn Yield** - Your escrowed funds earn 5% APY in OUSG while waiting
4. **Approve Work** - Review and approve completed milestones
5. **Release Payment** - Freelancer gets paid + you keep the yield earned!

### For Freelancers

1. **Browse Jobs** - Find projects matching your skills
2. **Submit Proposals** - Apply with your rate and timeline
3. **Deliver Work** - Complete milestones and submit proof
4. **Get Paid** - Receive payment instantly in crypto

---

## 💰 The Yield Advantage

**Example:** You create a 3-month project worth $10,000 USDC

| Traditional Escrow | Yieldra |
|-------------------|---------|
| $10,000 locked, earning $0 | $10,000 in OUSG earning 5% APY |
| After 3 months: $0 interest | After 3 months: **$125 yield earned** |
| Freelancer gets: $10,000 | Freelancer gets: $10,000 |
| You get: $0 | **You keep: $125** |

**Everyone wins!** Freelancers get paid securely, clients earn passive income while waiting.

---

## 🌐 Deployed Contracts (Stellar Testnet)

```
Escrow Core:       CA63NBJU756G7ZKSFUVXEKALCI7MVO6WXSGDY2CUQGY26LWGWWGTBHQ7
Liquidity Router:  CCCYIVHMEBEY5TGZYKV3DFPYR4OG3HZXBT5MFFNJUDLF7ZZEGCVZMIAX
Yield Harvester:   CDYLM2I4J6K57CDK3AFZXKL4H4QTKECSEKRNALY6U6TA7ODPQCS35PPX
```

[View on Stellar Expert](https://stellar.expert/explorer/testnet)

---

## 🛠️ Tech Stack

**Blockchain:**
- Stellar/Soroban smart contracts (Rust)
- OUSG (Real World Asset - Tokenized US Treasuries)
- Stellar DEX for liquidity

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- Framer Motion (smooth animations & transitions)
- React Router DOM (navigation)
- Freighter Wallet integration
- LocalStorage (wallet persistence)

**Smart Contracts:**
- `escrow_core` - Job and payment management with milestone tracking
- `rwa_yield_harvester` - Automatic OUSG yield generation (5% APY)
- `liquidity_router` - Multi-currency swaps via Stellar DEX

**UI Components:**
- Animated counters and progress bars
- Gradient backgrounds with motion effects
- Skeleton loaders for async data
- Toast notifications
- Modal dialogs with smooth transitions

---

## 🎨 Design System

### Colors
- **Primary**: Orange/Coral (#F97316)
- **Background**: Pure Black (#000000)
- **Surface**: Dark Gray (#0F0F0F)
- **Text**: White (#FFFFFF) / Gray variations

### Typography
- Headlines: 700-800 weight, orange accent
- Body: 400-500 weight
- Numbers: Monospace for addresses/amounts

---

## 🔐 Security

- ✅ Milestone-based escrow prevents payment disputes
- ✅ Smart contract code audited (testnet - audit needed for mainnet)
- ✅ Trustless - no centralized party controls funds
- ✅ Battle-tested Stellar blockchain infrastructure
- ✅ Real World Assets (OUSG) backed by US Treasury bonds

---

## 🌍 Supported Currencies

| Currency | Symbol | Type |
|----------|--------|------|
| Stellar Lumens | XLM | Native |
| USD Coin | USDC | Stablecoin |
| OUSG | OUSG | RWA Token |
| Indian Rupee* | INR | Fiat Token |
| Kenyan Shilling* | KES | Fiat Token |
| Nigerian Naira* | NGN | Fiat Token |

*Fiat tokens coming soon

---

## 🎯 Roadmap

- [x] Core escrow functionality
- [x] OUSG yield integration
- [x] Multi-currency support
- [x] Testnet deployment
- [x] Modern UI with animations
- [ ] Security audit
- [ ] Mainnet deployment
- [ ] Dispute resolution system
- [ ] Freelancer reputation system
- [ ] Mobile app (React Native)
- [ ] Fiat on/off ramps

---

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🙏 Acknowledgments

- Stellar Development Foundation for Soroban
- Ondo Finance for OUSG tokenization
- Freighter Wallet team

---

## 📞 Contact

- Website: [yieldra.io](#)
- Twitter: [@yieldra](#)
- Discord: [Join our community](#)
- Email: hello@yieldra.io

---

**Built with ❤️ on Stellar**

*Earn while you pay. That's the Yieldra difference.*
