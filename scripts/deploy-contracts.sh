#!/bin/bash

# Yieldra Contract Deployment Script
# Deploy all contracts to Stellar Testnet

set -e

echo "🚀 Deploying Yieldra Contracts to Testnet..."

# Network configuration
NETWORK="testnet"
SOROBAN_RPC="https://soroban-testnet.stellar.org:443"

# Contract source paths
ESCROW_CORE_SRC="contracts/escrow_core"
LIQUIDITY_ROUTER_SRC="contracts/liquidity_router"
YIELD_HARVESTER_SRC="contracts/yield_harvester"

# Get deployer address
DEPLOYER=$(stellar keys address deployer)
echo "📍 Deployer Address: $DEPLOYER"

# Build contracts first
echo "🔨 Building contracts..."
cd contracts/escrow_core && cargo build --target wasm32-unknown-unknown --release && cd ../..
cd contracts/liquidity_router && cargo build --target wasm32-unknown-unknown --release && cd ../..
cd contracts/yield_harvester && cargo build --target wasm32-unknown-unknown --release && cd ../..

# Deploy EscrowCore
echo "📦 Deploying EscrowCore..."
ESCROW_CORE_ID=$(stellar contract deploy \
  --wasm contracts/escrow_core/target/wasm32-unknown-unknown/release/escrow_core.wasm \
  --source deployer \
  --network $NETWORK)
echo "✅ EscrowCore deployed: $ESCROW_CORE_ID"

# Deploy LiquidityRouter
echo "📦 Deploying LiquidityRouter..."
LIQUIDITY_ROUTER_ID=$(stellar contract deploy \
  --wasm contracts/liquidity_router/target/wasm32-unknown-unknown/release/liquidity_router.wasm \
  --source deployer \
  --network $NETWORK)
echo "✅ LiquidityRouter deployed: $LIQUIDITY_ROUTER_ID"

# Deploy YieldHarvester
echo "📦 Deploying YieldHarvester..."
YIELD_HARVESTER_ID=$(stellar contract deploy \
  --wasm contracts/yield_harvester/target/wasm32-unknown-unknown/release/yield_harvester.wasm \
  --source deployer \
  --network $NETWORK)
echo "✅ YieldHarvester deployed: $YIELD_HARVESTER_ID"

# Save contract addresses
echo "💾 Saving contract addresses..."
cat > .env.testnet << EOF
# Stellar Testnet Contract Addresses
VITE_CONTRACT_ESCROW_CORE=$ESCROW_CORE_ID
VITE_CONTRACT_LIQUIDITY_ROUTER=$LIQUIDITY_ROUTER_ID
VITE_CONTRACT_YIELD_HARVESTER=$YIELD_HARVESTER_ID

# Network Configuration
VITE_STELLAR_NETWORK=testnet
VITE_STELLAR_RPC_URL=$SOROBAN_RPC
EOF

echo "🎉 All contracts deployed successfully!"
echo "📋 Contract IDs:"
echo "  EscrowCore: $ESCROW_CORE_ID"
echo "  LiquidityRouter: $LIQUIDITY_ROUTER_ID"
echo "  YieldHarvester: $YIELD_HARVESTER_ID"
echo ""
echo "💡 Next: Initialize contracts with addresses..."
