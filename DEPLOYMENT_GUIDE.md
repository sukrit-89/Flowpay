# FlowPay Deployment & Testing Guide

## ✅ Current Status (January 24, 2026)

### **Contracts Deployed & Initialized**

All contracts have been deployed to Stellar Testnet and properly initialized.

#### Contract Addresses:

```
EscrowCore:      CCL2WYWOGEHP3XRK6C6OQ6CG5VDXYWFYBMTX7HYEOQZDFKPATDU3JSKR
YieldHarvester:  CCFQI6TII3GVY2HF2H3Q4PMDLSSF2XJKNEKXOH2TFU2XR4PYIWM3TNQQ
LiquidityRouter: CDTDGS22DS33NPH2GNE4UWPYEJD57MJN6DTPDZXLD46SIKNNCYNKNA3A
```

### **Frontend Configuration**

- ✅ Updated `.env` file with new contract addresses
- ✅ Running on http://localhost:3001/
- ✅ Connected to Stellar Testnet

## 🔧 Recent Fixes

### **Critical Bug Fixed: Funds Not Reaching Freelancer**

**Problem Identified:**

- Client funds were deducted ✅
- Transaction appeared on testnet ✅
- Freelancer never received payment ❌
- Funds disappeared ❌

**Root Cause:**
The YieldHarvester contract was only tracking deposits/withdrawals in storage but **not actually holding or transferring tokens**.

**Solution Implemented:**
Updated YieldHarvester to:

1. Accept and hold actual tokens on deposit
2. Transfer tokens back on withdrawal
3. Include token_address in Position struct
4. Update escrow to use contract address (not client) for deposits

**Changes Made:**

- `contracts/yield_harvester/src/lib.rs` - Added actual token transfers
- `contracts/escrow_core/src/lib.rs` - Fixed deposit/withdrawal flow
- Redeployed and initialized all contracts

## 🧪 Testing Instructions

### **1. Connect Wallet**

- Open http://localhost:3001/
- Click "Connect Wallet"
- Approve Freighter connection

### **2. Create a Job (Client)**

- Go to Client Dashboard
- Click "Create New Job"
- Fill in:
  - Freelancer address (copy from test account)
  - Amount (e.g., 100 USDC)
  - Number of milestones (e.g., 3)
- Submit and approve in Freighter
- **Note:** Your balance will be deducted immediately

### **3. Submit Proof (Freelancer)**

- Switch to freelancer account in Freighter
- Go to Freelancer Dashboard
- Find the job and click "View Details"
- Submit proof of work for a milestone
- Client will see "Proof Submitted" status

### **4. Approve & Release Payment (Client)**

- Switch back to client account
- Go to job details
- Click "Approve Milestone"
- Click "Release Payment"
- **Expected Result:** Freelancer receives funds + 1% yield! 🎉

### **5. Verify on Stellar**

- Check transaction on https://stellar.expert/explorer/testnet
- Both client and freelancer addresses should show transactions
- Freelancer balance should increase by payment amount + yield

## 🔍 Troubleshooting

### **Error: "Contract data key outside of footprint"**

This means you're using old contract addresses. Solution:

1. Clear browser cache
2. Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
3. Verify `.env` has correct addresses

### **Error: "Already initialized"**

Contract was already initialized. This is normal - you can ignore this error.

### **Frontend not picking up changes**

1. Stop the dev server (Ctrl+C)
2. Clear browser cache
3. Restart: `cd frontend && npm run dev`

### **Freelancer not receiving funds**

1. Check that you're using the NEW contract addresses (starting with CCL2, CCFQ, CDTD)
2. Verify transaction on Stellar explorer
3. Make sure milestone was both approved AND payment released
4. Check Freighter wallet for the freelancer account

## 📊 Contract Verification

### **Check if contracts are initialized:**

```bash
# Check YieldHarvester
stellar contract invoke \
  --id CCFQI6TII3GVY2HF2H3Q4PMDLSSF2XJKNEKXOH2TFU2XR4PYIWM3TNQQ \
  --network testnet \
  -- get_total_deposits

# Check EscrowCore job counter
stellar contract invoke \
  --id CCL2WYWOGEHP3XRK6C6OQ6CG5VDXYWFYBMTX7HYEOQZDFKPATDU3JSKR \
  --network testnet \
  -- get_client_jobs \
  --client <YOUR_ADDRESS>
```

## 🎯 Next Steps

1. **Test Complete Flow:** Create job → Submit proof → Approve → Release payment
2. **Verify Yield:** Check that freelancer receives 101% of milestone amount (100% + 1% yield)
3. **Monitor Testnet:** Use https://stellar.expert/explorer/testnet to track all transactions
4. **Test Edge Cases:** Multiple milestones, cancellations, disputes

## 📝 Important Notes

- All amounts are in stroops (1 XLM = 10,000,000 stroops)
- USDC uses 6 decimals (1 USDC = 1,000,000)
- Yield is currently set to 1% for demo purposes
- Contracts are on TESTNET - not real money
- Keep your deployer key safe (has contract admin privileges)

## 🔗 Useful Links

- **Stellar Expert Testnet:** https://stellar.expert/explorer/testnet
- **Stellar Laboratory:** https://lab.stellar.org/
- **Freighter Wallet:** https://www.freighter.app/

---

**Last Updated:** January 24, 2026  
**Status:** ✅ All systems operational
