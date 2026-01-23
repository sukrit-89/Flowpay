#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, token};

#[contracttype]
#[derive(Clone)]
pub struct YieldPosition {
    pub owner: Address,
    pub principal: i128,              // Original USDC deposited
    pub ousg_balance: i128,           // Current OUSG holdings
    pub deposited_at: u64,            // Timestamp of deposit
    pub last_harvest_at: u64,         // Last yield calculation
    pub total_yield_earned: i128,     // Cumulative yield
}

#[contract]
pub struct RwaYieldHarvester;

#[contractimpl]
impl RwaYieldHarvester {
    /// Deposit USDC and convert to OUSG for yield generation
    pub fn deposit(
        env: Env,
        from: Address,
        usdc_amount: i128,
        usdc_token: Address,
        ousg_token: Address,
    ) -> i128 {
        from.require_auth();
        
        // Transfer USDC from user to this contract
        let usdc_client = token::TokenClient::new(&env, &usdc_token);
        usdc_client.transfer(&from, &env.current_contract_address(), &usdc_amount);
        
        Self::process_deposit(env, from, usdc_amount, usdc_token, ousg_token)
    }
    
    /// Deposit from contract (for EscrowCore integration)
    /// Requires USDC to already be transferred to this contract
    pub fn deposit_from_contract(
        env: Env,
        from_contract: Address,
        owner: Address, // The actual owner (client) who will receive yield
        usdc_amount: i128,
        usdc_token: Address,
        ousg_token: Address,
    ) -> i128 {
        // Verify USDC was already transferred to this contract
        let usdc_client = token::TokenClient::new(&env, &usdc_token);
        let balance = usdc_client.balance(&env.current_contract_address());
        if balance < usdc_amount {
            panic!("Insufficient USDC transferred to contract");
        }
        
        // Process deposit for the owner (client), not the calling contract
        Self::process_deposit(env, owner, usdc_amount, usdc_token, ousg_token)
    }
    
    /// Internal: Process deposit and create/update position
    fn process_deposit(
        env: Env,
        owner: Address,
        usdc_amount: i128,
        usdc_token: Address,
        ousg_token: Address,
    ) -> i128 {
        
        // Swap USDC for OUSG
        // In production: call OUSG issuer's mint function or use DEX
        // For testnet: simulate 1:1 swap
        let ousg_amount = Self::swap_usdc_to_ousg(
            env.clone(),
            usdc_token,
            ousg_token.clone(),
            usdc_amount
        );
        
        // Create or update yield position
        let position_key = (Symbol::new(&env, "position"), owner.clone());
        
        let position = if let Some(mut existing) = env.storage().persistent().get::<_, YieldPosition>(&position_key) {
            // Update existing position
            existing.principal += usdc_amount;
            existing.ousg_balance += ousg_amount;
            existing
        } else {
            // Create new position
            YieldPosition {
                owner: owner.clone(),
                principal: usdc_amount,
                ousg_balance: ousg_amount,
                deposited_at: env.ledger().timestamp(),
                last_harvest_at: env.ledger().timestamp(),
                total_yield_earned: 0,
            }
        };
        
        env.storage().persistent().set(&position_key, &position);
        
        // Emit event
        env.events().publish(
            (Symbol::new(&env, "deposit"),),
            (owner, usdc_amount, ousg_amount)
        );
        
        ousg_amount
    }
    
    /// Calculate current accrued yield (not yet claimed)
    pub fn calculate_yield(
        env: Env,
        owner: Address,
    ) -> i128 {
        let position_key = (Symbol::new(&env, "position"), owner);
        let position: YieldPosition = env.storage().persistent().get(&position_key).unwrap();
        
        // Time since last harvest (in seconds)
        let duration = env.ledger().timestamp() - position.last_harvest_at;
        
        // OUSG APY: 5% annually
        let apy_bps = 500; // 5% = 500 basis points
        let seconds_per_year = 31_536_000u64;
        
        // Yield = principal × APY × (time / year)
        // Using 7 decimals (Stellar standard)
        let yield_earned = (position.ousg_balance * apy_bps * duration as i128) 
                          / (seconds_per_year as i128 * 10000);
        
        yield_earned
    }
    
    /// Harvest (compound) accrued yield
    pub fn harvest_yield(
        env: Env,
        owner: Address,
    ) -> i128 {
        owner.require_auth();
        
        let position_key = (Symbol::new(&env, "position"), owner.clone());
        let mut position: YieldPosition = env.storage().persistent().get(&position_key).unwrap();
        
        // Calculate yield since last harvest
        let yield_amount = Self::calculate_yield(env.clone(), owner.clone());
        
        // Compound yield back into OUSG balance
        position.ousg_balance += yield_amount;
        position.total_yield_earned += yield_amount;
        position.last_harvest_at = env.ledger().timestamp();
        
        env.storage().persistent().set(&position_key, &position);
        
        // Emit event
        env.events().publish(
            (Symbol::new(&env, "yield_harvested"),),
            (owner, yield_amount, position.total_yield_earned)
        );
        
        yield_amount
    }
    
    /// Withdraw OUSG back to USDC
    pub fn withdraw(
        env: Env,
        owner: Address,
        ousg_amount: i128,
        ousg_token: Address,
        usdc_token: Address,
    ) -> i128 {
        owner.require_auth();
        
        let position_key = (Symbol::new(&env, "position"), owner.clone());
        let mut position: YieldPosition = env.storage().persistent().get(&position_key).unwrap();
        
        // Ensure sufficient balance
        if position.ousg_balance < ousg_amount {
            panic!("Insufficient OUSG balance");
        }
        
        // Harvest any pending yield first
        let pending_yield = Self::calculate_yield(env.clone(), owner.clone());
        if pending_yield > 0 {
            position.ousg_balance += pending_yield;
            position.total_yield_earned += pending_yield;
            position.last_harvest_at = env.ledger().timestamp();
        }
        
        // Redeem OUSG for USDC
        let usdc_amount = Self::redeem_ousg_to_usdc(
            env.clone(),
            ousg_token,
            usdc_token.clone(),
            ousg_amount
        );
        
        // Transfer USDC to owner
        let usdc_client = token::TokenClient::new(&env, &usdc_token);
        usdc_client.transfer(&env.current_contract_address(), &owner, &usdc_amount);
        
        // Update position
        position.ousg_balance -= ousg_amount;
        env.storage().persistent().set(&position_key, &position);
        
        // Emit event
        env.events().publish(
            (Symbol::new(&env, "withdraw"),),
            (owner, ousg_amount, usdc_amount)
        );
        
        usdc_amount
    }
    
    /// Withdraw only principal amount (in USDC terms) without harvesting yield
    /// This allows withdrawing principal while leaving accrued yield in the position
    pub fn withdraw_principal(
        env: Env,
        owner: Address,
        usdc_principal_amount: i128,
        ousg_token: Address,
        usdc_token: Address,
    ) -> i128 {
        owner.require_auth();
        Self::withdraw_principal_internal(env, owner, usdc_principal_amount, owner.clone(), ousg_token, usdc_token)
    }
    
    /// Withdraw principal on behalf of owner (for EscrowCore integration)
    /// Transfers USDC to recipient (EscrowCore) instead of owner
    pub fn withdraw_principal_for_owner(
        env: Env,
        owner: Address,
        usdc_principal_amount: i128,
        recipient: Address, // Where to send USDC (usually EscrowCore)
        ousg_token: Address,
        usdc_token: Address,
    ) -> i128 {
        // In production, verify calling contract is EscrowCore
        // For now, allow any contract call (can add whitelist later)
        Self::withdraw_principal_internal(env, owner, usdc_principal_amount, recipient, ousg_token, usdc_token)
    }
    
    /// Internal: Withdraw principal logic
    fn withdraw_principal_internal(
        env: Env,
        owner: Address,
        usdc_principal_amount: i128,
        recipient: Address,
        ousg_token: Address,
        usdc_token: Address,
    ) -> i128 {
        
        let position_key = (Symbol::new(&env, "position"), owner.clone());
        let mut position: YieldPosition = env.storage().persistent().get(&position_key).unwrap();
        
        // Ensure we have enough principal to withdraw
        if position.principal < usdc_principal_amount {
            panic!("Insufficient principal balance");
        }
        
        // Calculate how much OUSG corresponds to this principal amount
        // Since we use 1:1 ratio for simplicity, principal_amount = ousg_amount
        // In production, this would account for OUSG price changes
        let ousg_to_withdraw = usdc_principal_amount;
        
        // Ensure sufficient OUSG balance
        if position.ousg_balance < ousg_to_withdraw {
            panic!("Insufficient OUSG balance");
        }
        
        // Redeem OUSG for USDC (1:1 for mock)
        let usdc_amount = Self::redeem_ousg_to_usdc(
            env.clone(),
            ousg_token,
            usdc_token.clone(),
            ousg_to_withdraw
        );
        
        // Transfer USDC to recipient (EscrowCore)
        let usdc_client = token::TokenClient::new(&env, &usdc_token);
        usdc_client.transfer(&env.current_contract_address(), &recipient, &usdc_amount);
        
        // Update position: reduce principal and OUSG balance
        position.principal -= usdc_principal_amount;
        position.ousg_balance -= ousg_to_withdraw;
        env.storage().persistent().set(&position_key, &position);
        
        // Emit event
        env.events().publish(
            (Symbol::new(&env, "principal_withdrawn"),),
            (owner, usdc_principal_amount, usdc_amount, recipient)
        );
        
        usdc_amount
    }
    
    /// Get position details
    pub fn get_position(
        env: Env,
        owner: Address,
    ) -> YieldPosition {
        let position_key = (Symbol::new(&env, "position"), owner);
        env.storage().persistent().get(&position_key).unwrap()
    }
    
    /// Internal: Swap USDC for OUSG
    fn swap_usdc_to_ousg(
        _env: Env,
        _usdc_token: Address,
        _ousg_token: Address,
        usdc_amount: i128,
    ) -> i128 {
        // In production, this would:
        // 1. Call OUSG issuer's mint function, OR
        // 2. Swap via DEX if OUSG is tradeable
        
        // For testnet: 1:1 swap (OUSG starts at $1)
        // In production, would transfer OUSG from reserves
        
        // In real impl, would call OUSG contract or DEX
        // For demo, assume we have OUSG reserves
        let ousg_amount = usdc_amount; // 1:1 ratio
        
        ousg_amount
    }
    
    /// Internal: Redeem OUSG back to USDC
    fn redeem_ousg_to_usdc(
        _env: Env,
        _ousg_token: Address,
        _usdc_token: Address,
        ousg_amount: i128,
    ) -> i128 {
        // In production:
        // 1. Call OpenEden redemption API/contract
        // 2. OUSG redeems 1:1 to USDC (plus accrued interest)
        
        // For testnet: 1:1 redemption
        let usdc_amount = ousg_amount;
        
        // Transfer USDC from reserve
        // In real impl, would receive from OUSG issuer
        
        usdc_amount
    }
    
    /// Admin: Set OUSG reserves (for testing)
    pub fn set_ousg_reserve(
        env: Env,
        admin: Address,
        ousg_token: Address,
        amount: i128,
    ) {
        admin.require_auth();
        
        let key = (Symbol::new(&env, "ousg_reserve"),);
        env.storage().persistent().set(&key, &amount);
    }
}

// Note: In production integration with OUSG:
// 1. Use OpenEden's Soroban contract (when available)
// 2. Or bridge OUSG from Ethereum using Stellar anchors
// 3. Implement real redemption queue and settlement
