#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, panic_with_error, Address, Env, Symbol, token, String, Vec};

#[contracttype]
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Error {
    SlippageExceeded = 1,
    InvalidPath = 2,
    InsufficientLiquidity = 3,
    PoolNotFound = 4,
}

#[contract]
pub struct LiquidityRouter;

#[contractimpl]
impl LiquidityRouter {
    /// Main function: Convert from one asset to another and send to recipient
    /// Handles single-hop or multi-hop swaps automatically
    pub fn convert_and_send(
        env: Env,
        from_asset: Address,
        to_asset: Address,
        amount: i128,
        recipient: Address,
        max_slippage_bps: i128, // 100 = 1%, 500 = 5%
    ) -> i128 {
        // If same asset, just transfer directly
        if from_asset == to_asset {
            let token_client = token::TokenClient::new(&env, &from_asset);
            token_client.transfer(&env.current_contract_address(), &recipient, &amount);
            return amount;
        }
        
        // Get expected output (for slippage check)
        let expected_output = Self::get_exchange_rate(
            env.clone(),
            from_asset.clone(),
            to_asset.clone(),
            amount
        );
        
        // Calculate minimum acceptable output (slippage protection)
        let min_output = expected_output - (expected_output * max_slippage_bps / 10000);
        
        // Execute swap
        let actual_output = Self::execute_swap(
            env.clone(),
            from_asset,
            to_asset.clone(),
            amount,
            min_output
        );
        
        // Transfer final currency to recipient
        let token_client = token::TokenClient::new(&env, &to_asset);
        token_client.transfer(&env.current_contract_address(), &recipient, &actual_output);
        
        // Emit event
        env.events().publish(
            (Symbol::new(&env, "conversion_complete"),),
            (recipient, actual_output)
        );
        
        actual_output
    }
    
    /// Get current exchange rate for converting from_asset to to_asset
    /// Returns expected output amount for given input amount
    pub fn get_exchange_rate(
        env: Env,
        from_asset: Address,
        to_asset: Address,
        amount: i128,
    ) -> i128 {
        if from_asset == to_asset {
            return amount;
        }
        
        let xlm_address = Self::get_xlm_address(env.clone());
        
        // Determine path: direct or through XLM
        if from_asset == xlm_address || to_asset == xlm_address {
            // Single hop
            Self::quote_single_swap(env, from_asset, to_asset, amount)
        } else {
            // Multi-hop through XLM
            let xlm_amount = Self::quote_single_swap(
                env.clone(),
                from_asset,
                xlm_address.clone(),
                amount
            );
            
            Self::quote_single_swap(env, xlm_address, to_asset, xlm_amount)
        }
    }
    
    /// Execute swap (internal)
    fn execute_swap(
        env: Env,
        from_asset: Address,
        to_asset: Address,
        amount: i128,
        min_output: i128,
    ) -> i128 {
        let xlm_address = Self::get_xlm_address(env.clone());
        
        if from_asset == xlm_address || to_asset == xlm_address {
            // Single hop swap
            Self::swap_tokens(env, from_asset, to_asset, amount, min_output)
        } else {
            // Two-hop swap through XLM
            
            // First swap: from_asset → XLM
            let xlm_amount = Self::swap_tokens(
                env.clone(),
                from_asset,
                xlm_address.clone(),
                amount,
                0 // No min for intermediate swap
            );
            
            // Second swap: XLM → to_asset
            Self::swap_tokens(env, xlm_address, to_asset, xlm_amount, min_output)
        }
    }
    
    /// Perform actual token swap via liquidity pool
    fn swap_tokens(
        env: Env,
        from_asset: Address,
        to_asset: Address,
        amount_in: i128,
        min_amount_out: i128,
    ) -> i128 {
        // Get pool address for this pair
        let pool_address = Self::get_pool_address(
            env.clone(),
            from_asset.clone(),
            to_asset.clone()
        );
        
        // Get pool reserves
        let (reserve_from, reserve_to) = Self::get_pool_reserves(
            env.clone(),
            pool_address.clone()
        );
        
        // Calculate output using constant product formula
        let amount_out = Self::calculate_swap_output(amount_in, reserve_from, reserve_to);
        
        // Check slippage
        if amount_out < min_amount_out {
            panic_with_error!(&env, Error::SlippageExceeded);
        }
        
        // Execute swap by calling pool contract
        // In production, this calls Stellar's native liquidity pool
        // For testnet/demo, we simulate the swap
        
        // Transfer input token to pool
        let from_token = token::TokenClient::new(&env, &from_asset);
        from_token.transfer(&env.current_contract_address(), &pool_address, &amount_in);
        
        // Pool transfers output token back
        let to_token = token::TokenClient::new(&env, &to_asset);
        to_token.transfer(&pool_address, &env.current_contract_address(), &amount_out);
        
        amount_out
    }
    
    /// Quote a single swap without executing
    fn quote_single_swap(
        env: Env,
        from_asset: Address,
        to_asset: Address,
        amount_in: i128,
    ) -> i128 {
        let pool_address = Self::get_pool_address(env.clone(), from_asset, to_asset);
        let (reserve_from, reserve_to) = Self::get_pool_reserves(env, pool_address);
        Self::calculate_swap_output(amount_in, reserve_from, reserve_to)
    }
    
    /// Calculate swap output using constant product AMM formula
    /// Formula: Δy = (997 * Δx * y) / (1000 * x + 997 * Δx)
    /// Includes 0.3% fee
    fn calculate_swap_output(
        input_amount: i128,
        input_reserve: i128,
        output_reserve: i128,
    ) -> i128 {
        if input_reserve == 0 || output_reserve == 0 {
            return 0;
        }
        
        let input_with_fee = input_amount * 997; // 0.3% fee
        let numerator = input_with_fee * output_reserve;
        let denominator = (input_reserve * 1000) + input_with_fee;
        
        numerator / denominator
    }
    
    /// Get liquidity pool address for asset pair (deterministic)
    fn get_pool_address(
        env: Env,
        asset_a: Address,
        asset_b: Address,
    ) -> Address {
        // Ensure consistent ordering
        let (ordered_a, ordered_b) = if asset_a < asset_b {
            (asset_a, asset_b)
        } else {
            (asset_b, asset_a)
        };
        
        // Create deterministic pool ID
        let mut pool_data = soroban_sdk::Bytes::new(&env);
        pool_data.append(&soroban_sdk::Bytes::from_slice(&env, b"stellar_pool"));
        pool_data.append(&ordered_a.to_xdr(&env));
        pool_data.append(&ordered_b.to_xdr(&env));
        
        let pool_hash = env.crypto().sha256(&pool_data);
        
        // Convert hash to address
        // In production, query Stellar's pool registry
        Address::from_contract_id(&pool_hash)
    }
    
    /// Get pool reserves (mock for testnet)
    fn get_pool_reserves(
        env: Env,
        pool_address: Address,
    ) -> (i128, i128) {
        // In production, query actual pool state
        // For demo: Return mock reserves
        
        // Try to read from storage (if pool exists)
        let key = (Symbol::new(&env, "reserves"), pool_address);
        
        if let Some(reserves) = env.storage().persistent().get::<_, (i128, i128)>(&key) {
            reserves
        } else {
            // Default mock reserves: 1M USDC, 10M XLM
            (1_000_000_0000000, 10_000_000_0000000)
        }
    }
    
    /// Get XLM (Stellar native asset) address
    fn get_xlm_address(env: Env) -> Address {
        // XLM canonical address on Stellar
        // In production, use actual XLM contract address
        Address::from_string(&String::from_str(
            &env,
            "CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
        ))
    }
    
    /// Admin: Set pool reserves (for testing)
    pub fn set_pool_reserves(
        env: Env,
        pool_address: Address,
        reserve_a: i128,
        reserve_b: i128,
    ) {
        let key = (Symbol::new(&env, "reserves"), pool_address);
        env.storage().persistent().set(&key, &(reserve_a, reserve_b));
    }
}

// Note: In production on Stellar, you would import and use the native
// liquidity pool functions instead of implementing from scratch.
// This implementation demonstrates the logic for testing/simulation.
