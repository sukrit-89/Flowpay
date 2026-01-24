#!/bin/bash

# Yieldra Contract Initialization Script
# Initialize contracts with proper addresses and settings

set -e

echo "🔧 Initializing Yieldra Contracts..."

# Load contract addresses
if [ -f .env.testnet ]; then
    source .env.testnet
else
    echo "❌ .env.testnet not found. Please run deploy-contracts.sh first."
    exit 1
fi

NETWORK="testnet"

# Get deployer address
DEPLOYER=$(stellar keys address deployer)
echo "📍 Deployer Address: $DEPLOYER"

echo ""
echo "📋 Using Contract Addresses:"
echo "  EscrowCore: $VITE_CONTRACT_ESCROW_CORE"
echo "  LiquidityRouter: $VITE_CONTRACT_LIQUIDITY_ROUTER"
echo "  YieldHarvester: $VITE_CONTRACT_YIELD_HARVESTER"
echo ""

# Initialize YieldHarvester first
echo "⚙️ Initializing YieldHarvester..."
stellar contract invoke \
  --id $VITE_CONTRACT_YIELD_HARVESTER \
  --source deployer \
  --network $NETWORK \
  -- \
  initialize \
  --base_rate 100 \
  --bonus_rate 50 \
  --lock_period 86400

echo "✅ YieldHarvester initialized"

# Initialize EscrowCore
echo "⚙️ Initializing EscrowCore..."
stellar contract invoke \
  --id $VITE_CONTRACT_ESCROW_CORE \
  --source deployer \
  --network $NETWORK \
  -- \
  initialize \
  --yield_harvester $VITE_CONTRACT_YIELD_HARVESTER \
  --liquidity_router $VITE_CONTRACT_LIQUIDITY_ROUTER \
  --usdc_token "USDC" \
  --min_lock_period 86400

echo "✅ EscrowCore initialized"

echo ""
echo "🎉 All contracts initialized successfully!"
echo ""
echo "📋 Contract Status:"
echo "  EscrowCore: ✅ Initialized"
echo "  YieldHarvester: ✅ Initialized" 
echo ""
echo "💡 Next: Use the frontend to create jobs and test the flow"
