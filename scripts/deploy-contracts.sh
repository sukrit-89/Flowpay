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
DEPLOYER=$(soroban keys address deployer)
echo "📍 Deployer Address: $DEPLOYER"

# Check balance
echo "💰 Checking balance..."
soroban account balance --id $DEPLOYER --network $NETWORK

# Deploy EscrowCore
echo "📦 Deploying EscrowCore..."
ESCROW_CORE_WASM=$(soroban contract build --wasm $ESCROW_CORE_SRC)
ESCROW_CORE_ID=$(soroban contract deploy --wasm $ESCROW_CORE_WASM --source deployer --network $NETWORK)
echo "✅ EscrowCore deployed: $ESCROW_CORE_ID"

# Deploy LiquidityRouter
echo "📦 Deploying LiquidityRouter..."
LIQUIDITY_ROUTER_WASM=$(soroban contract build --wasm $LIQUIDITY_ROUTER_SRC)
LIQUIDITY_ROUTER_ID=$(soroban contract deploy --wasm $LIQUIDITY_ROUTER_WASM --source deployer --network $NETWORK)
echo "✅ LiquidityRouter deployed: $LIQUIDITY_ROUTER_ID"

# Deploy YieldHarvester
echo "📦 Deploying YieldHarvester..."
YIELD_HARVESTER_WASM=$(soroban contract build --wasm $YIELD_HARVESTER_SRC)
YIELD_HARVESTER_ID=$(soroban contract deploy --wasm $YIELD_HARVESTER_WASM --source deployer --network $NETWORK)
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
