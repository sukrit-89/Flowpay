#!/bin/bash

# Yieldra Contract Initialization Script
# Initialize contracts with proper addresses and settings

set -e

echo "🔧 Initializing Yieldra Contracts..."

# Load contract addresses
source .env.testnet

NETWORK="testnet"
SOROBAN_RPC="https://soroban-testnet.stellar.org:443"

# Get deployer address
DEPLOYER=$(soroban keys address deployer)
echo "📍 Deployer Address: $DEPLOYER"

# Initialize EscrowCore
echo "⚙️ Initializing EscrowCore..."
soroban contract invoke \
  --id $VITE_CONTRACT_ESCROW_CORE \
  --source deployer \
  --network $NETWORK \
  --function initialize \
  --arg-address $VITE_CONTRACT_YIELD_HARVESTER \
  --arg-address $VITE_CONTRACT_LIQUIDITY_ROUTER \
  --arg-string "USDC" \
  --arg-string "10000000" \
  --arg-string "86400"

echo "✅ EscrowCore initialized"

# Initialize LiquidityRouter
echo "⚙️ Initializing LiquidityRouter..."
soroban contract invoke \
  --id $VITE_CONTRACT_LIQUIDITY_ROUTER \
  --source deployer \
  --network $NETWORK \
  --function initialize \
  --arg-address $VITE_CONTRACT_YIELD_HARVESTER

echo "✅ LiquidityRouter initialized"

# Initialize YieldHarvester
echo "⚙️ Initializing YieldHarvester..."
soroban contract invoke \
  --id $VITE_CONTRACT_YIELD_HARVESTER \
  --source deployer \
  --network $NETWORK \
  --function initialize \
  --arg-string "1000000" \
  --arg-string "5000000" \
  --arg-string "86400"

echo "✅ YieldHarvester initialized"

# Set up USDC token (if needed)
echo "🪙 Setting up USDC token..."
USDC_ADDRESS="GBNZUSVBLFSDBP3B6R7TJ75CEJSDI5MSZSCYFOHOOTT6SLFSYUQ5T5J7"

soroban contract invoke \
  --id $USDC_ADDRESS \
  --source deployer \
  --network $NETWORK \
  --function mint \
  --arg-address $DEPLOYER \
  --arg-string "1000000000"

echo "✅ USDC minted to deployer"

echo "🎉 All contracts initialized successfully!"
echo ""
echo "📋 Contract Status:"
echo "  EscrowCore: Initialized with yield addresses"
echo "  LiquidityRouter: Initialized with yield harvester"
echo "  YieldHarvester: Initialized with yield parameters"
echo "  USDC: Minted to deployer for testing"
echo ""
echo "💡 Next: Test the complete flow..."
