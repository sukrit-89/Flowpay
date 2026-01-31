# FlowPay - Yield-Generating Freelance Escrow Protocol

A decentralized escrow platform built on Stellar that enables freelancers and clients to transact securely while earning yield on locked funds through Real World Assets (RWAs).

## 🚀 Features

- **Milestone-Based Escrow**: Smart contract enforced payment releases tied to proof of work
- **Yield Generation**: Earn 5% APY on escrowed funds via OUSG (US Treasury-backed tokens)
- **Multi-Currency Support**: USDC, XLM, INR, KES, NGN with built-in conversion
- **Zero Trust Required**: Fully automated execution via Soroban smart contracts
- **Dispute Resolution**: Built-in arbitration mechanism for payment conflicts

## 📋 Architecture

FlowPay consists of three core smart contracts:

```
┌─────────────────────────────────────────────┐
│           ESCROW CORE CONTRACT              │
│  Milestone management & payment releases    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────┴───────────────────────────┐
│         YIELD HARVESTER CONTRACT            │
│  Automatic RWA deposits & yield tracking    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────┴───────────────────────────┐
│        LIQUIDITY ROUTER CONTRACT            │
│  Multi-currency conversion & settlement     │
└─────────────────────────────────────────────┘
```

### Smart Contracts

#### 1. **Escrow Core** (`contracts/escrow_core/`)
Handles job creation, milestone tracking, and payment releases.

**Key Functions:**
- `create_job()` - Initialize escrow with milestones
- `submit_proof()` - Freelancer submits work proof
- `approve_payment()` - Client approves and releases funds
- `dispute_payment()` - Initiate dispute resolution

#### 2. **Yield Harvester** (`contracts/yield_harvester/`)
Manages automatic yield generation from RWA deposits.

**Key Functions:**
- `deposit_for_yield()` - Move funds to yield-bearing vault
- `request_withdraw_principal()` - Initiate withdrawal
- `claim_yield()` - Claim earned interest
- `calculate_apy()` - Compute compound interest

#### 3. **Liquidity Router** (`contracts/liquidity_router/`)
Handles multi-currency conversions and settlements.

**Key Functions:**
- `convert_and_send()` - Cross-currency settlement
- `get_exchange_rate()` - Real-time rate lookup
- `receive_and_convert()` - Inbound currency conversion

## 🛠️ Quick Start

### Prerequisites

- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- [Stellar CLI](https://developers.stellar.org/docs/tools/stellar-cli)
- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sukrit-89/Flowpay.git
   cd Flowpay
   ```

2. **Install contract dependencies**
   ```bash
   # Add wasm target for Soroban
   rustup target add wasm32-unknown-unknown
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

### Development Setup

#### 1. Deploy Contracts (Testnet)

```bash
# Navigate to scripts directory
cd scripts

# Make scripts executable (Linux/Mac)
chmod +x deploy-contracts.sh initialize-contracts.sh

# Deploy all contracts
./deploy-contracts.sh

# Initialize contracts with configuration
./initialize-contracts.sh
```

Contract addresses will be saved to `CONTRACT_ADDRESSES.md`.

#### 2. Configure Frontend

Create a `.env` file in the `frontend/` directory:

```bash
cd frontend
cp .env.example .env
```

Update `.env` with your deployed contract addresses:
```env
VITE_ESCROW_CONTRACT_ID=your_escrow_contract_id
VITE_YIELD_HARVESTER_CONTRACT_ID=your_yield_harvester_contract_id
VITE_LIQUIDITY_ROUTER_CONTRACT_ID=your_liquidity_router_contract_id
VITE_NETWORK=testnet
```

#### 3. Run Development Server

```bash
cd frontend
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

### Wallet Setup

FlowPay uses [Freighter](https://www.freighter.app/) for wallet integration.

1. Install the [Freighter browser extension](https://www.freighter.app/)
2. Create or import a wallet
3. Switch to **Stellar Testnet** in Freighter settings
4. Fund your testnet account at [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)

## 🧪 Testing

### Contract Tests

```bash
# Navigate to a contract directory
cd contracts/escrow_core

# Run tests
cargo test

# Run with output
cargo test -- --nocapture
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## 📦 Production Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions on deploying to Stellar mainnet.

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Contract Addresses](./CONTRACT_ADDRESSES.md) - Deployed contract information
- [Payment Flow Fix](./PAYMENT_FLOW_FIX.md) - Technical documentation on payment mechanics
- [Add USDC Guide](./ADD_USDC_GUIDE.md) - Guide for integrating USDC support
- [Investor Overview](./INVESTOR_OVERVIEW.md) - Business model and market analysis

## 🔐 Security Features

- **Milestone-based atomic payments** - No partial releases
- **Immutable proof storage** - All submissions on-chain
- **Time-locked dispute resolution** - Automated arbitration
- **30-second lockup period** - Security for yield withdrawals
- **Client signature requirement** - Authorization for all fund movements

## 🏗️ Project Structure

```
FlowPay/
├── contracts/               # Soroban smart contracts
│   ├── escrow_core/        # Main escrow logic
│   ├── yield_harvester/    # RWA yield generation
│   └── liquidity_router/   # Multi-currency support
├── frontend/               # React + TypeScript UI
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility libraries
│   │   └── App.tsx         # Main application
│   └── package.json
├── scripts/                # Deployment scripts
│   ├── deploy-contracts.sh
│   └── initialize-contracts.sh
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://soroban.stellar.org/)
- [Freighter Wallet](https://www.freighter.app/)
- [OpenEden OUSG](https://www.openeden.com/)

## 💬 Support

For questions or issues:
- Open an [issue](https://github.com/sukrit-89/Flowpay/issues)
- Check existing [documentation](./DEPLOYMENT_GUIDE.md)

---

**Built with ❤️ on Stellar**
