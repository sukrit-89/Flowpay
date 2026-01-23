#!/bin/bash

# Setup Frontend Environment with Real Contract Addresses
echo "🚀 Setting up frontend environment with deployed contracts..."

# Copy the updated .env.example to .env
cp frontend/.env.example frontend/.env

echo "✅ Frontend .env updated with real contract addresses:"
echo "   EscrowCore: CAWO4XZVKRIQKZLBLRLDFGV2NBNHD2PSHGQDYFCHJGSZJER2V6QFNIMB"
echo "   LiquidityRouter: CAEWF74SAM7FDS6SDY5CYLVTYJ3AHOC3UYRUJQAHQ54FS3UK6OMIVFW4"
echo "   YieldHarvester: CARLAQ4AFPRCQPX5VL7NV5JA36YMAFDUOK7DQMAPNVUPOSVTOQHHUN53"
echo "   SimpleToken: CD7DQDYYBFGAJKVB4MUQMGTIG47PAVEFNVU5CGULJNACG4ZRB65EUL5T"

echo ""
echo "🎯 Frontend is now configured with real deployed contracts!"
echo "   Run 'npm run dev' in frontend directory to start the app"
