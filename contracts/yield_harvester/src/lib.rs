#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Symbol, Map, token, IntoVal};

#[contracttype]
#[derive(Clone)]
pub struct Position {
    pub principal: i128,
    pub yield_earned: i128,
    pub created_at: u64,
    pub token_address: Address,
}

#[contract]
pub struct YieldHarvester;

#[contractimpl]
impl YieldHarvester {
    /// Initialize yield harvester
    pub fn initialize(env: Env, base_rate: u32, bonus_rate: u32, lock_period: u64) {
        if env.storage().instance().has(&Symbol::new(&env, "init")) {
            panic!("already initialized");
        }

        env.storage().instance().set(&Symbol::new(&env, "base_rate"), &base_rate);
        env.storage().instance().set(&Symbol::new(&env, "bonus_rate"), &bonus_rate);
        env.storage().instance().set(&Symbol::new(&env, "lock_period"), &lock_period);
        env.storage().instance().set(&Symbol::new(&env, "init"), &());
    }

    /// Deposit funds for yield generation (legacy - with transfer)
    pub fn deposit(env: Env, owner: Address, amount: i128, token_address: Address) {
        let position_key = Symbol::new(&env, "position");
        
        let mut position: Position = env.storage().instance()
            .get(&position_key)
            .unwrap_or(Position {
                principal: 0,
                yield_earned: 0,
                created_at: env.ledger().timestamp(),
                token_address: token_address.clone(),
            });

        position.principal += amount;
        position.token_address = token_address.clone();
        env.storage().instance().set(&position_key, &position);

        // Track total deposits
        let total_key = Symbol::new(&env, "total_deposits");
        let total: i128 = env.storage().instance().get(&total_key).unwrap_or(0);
        env.storage().instance().set(&total_key, &(total + amount));
        
        // Transfer tokens from depositor to this contract
        let token_client = token::TokenClient::new(&env, &token_address);
        token_client.transfer(&owner, &env.current_contract_address(), &amount);
    }

    /// Track deposit (tokens already transferred to this contract)
    pub fn track_deposit(env: Env, owner: Address, amount: i128, token_address: Address) {
        let position_key = Symbol::new(&env, "position");
        
        let mut position: Position = env.storage().instance()
            .get(&position_key)
            .unwrap_or(Position {
                principal: 0,
                yield_earned: 0,
                created_at: env.ledger().timestamp(),
                token_address: token_address.clone(),
            });

        position.principal += amount;
        position.token_address = token_address.clone();
        env.storage().instance().set(&position_key, &position);

        // Track total deposits
        let total_key = Symbol::new(&env, "total_deposits");
        let total: i128 = env.storage().instance().get(&total_key).unwrap_or(0);
        env.storage().instance().set(&total_key, &(total + amount));
    }

    /// Withdraw principal + yield
    pub fn withdraw(env: Env, owner: Address, amount: i128) -> i128 {
        let position_key = Symbol::new(&env, "position");
        let position: Position = env.storage().instance()
            .get(&position_key)
            .unwrap_or_else(|| panic!("no position found"));

        if position.principal < amount {
            panic!("insufficient principal");
        }

        // Calculate yield (1% for demo)
        let yield_amount = amount / 100; // 1% yield
        let total_withdraw = amount + yield_amount;

        // Update position
        let mut updated_position = position.clone();
        updated_position.principal -= amount;
        updated_position.yield_earned += yield_amount;
        
        env.storage().instance().set(&position_key, &updated_position);
        
        // Transfer tokens back to the caller (escrow contract)
        let token_client = token::TokenClient::new(&env, &position.token_address);
        token_client.transfer(&env.current_contract_address(), &owner, &total_withdraw);

        total_withdraw
    }

    /// Withdraw principal + yield to a specific recipient
    pub fn withdraw_to(env: Env, _owner: Address, amount: i128, recipient: Address) -> i128 {
        let position_key = Symbol::new(&env, "position");
        let position: Position = env.storage().instance()
            .get(&position_key)
            .unwrap_or_else(|| panic!("no position found"));

        if position.principal < amount {
            panic!("insufficient principal");
        }

        // Calculate yield (1% for demo)
        let yield_amount = amount / 100; // 1% yield
        let total_withdraw = amount + yield_amount;

        // Update position
        let mut updated_position = position.clone();
        updated_position.principal -= amount;
        updated_position.yield_earned += yield_amount;
        
        env.storage().instance().set(&position_key, &updated_position);
        
        // Transfer tokens directly to recipient using raw contract invocation
        // This allows the contract to authorize its own transfer
        let contract_address = env.current_contract_address();
        let mut args = soroban_sdk::Vec::new(&env);
        args.push_back(contract_address.into_val(&env));
        args.push_back(recipient.into_val(&env));
        args.push_back(total_withdraw.into_val(&env));
        
        env.invoke_contract::<()>(
            &position.token_address,
            &Symbol::new(&env, "transfer"),
            args,
        );

        total_withdraw
    }

    /// Get user balance
    pub fn get_user_balance(env: Env, owner: Address) -> i128 {
        let position_key = Symbol::new(&env, "position");
        if let Some(position) = env.storage().instance().get::<_, Position>(&position_key) {
            position.principal + position.yield_earned
        } else {
            0
        }
    }

    /// Get position details
    pub fn get_position(env: Env, owner: Address) -> Position {
        let position_key = Symbol::new(&env, "position");
        env.storage().instance()
            .get(&position_key)
            .unwrap_or_else(|| panic!("no position found"))
    }

    /// Get total deposits
    pub fn get_total_deposits(env: Env) -> i128 {
        let total_key = Symbol::new(&env, "total_deposits");
        env.storage().instance().get(&total_key).unwrap_or(0)
    }
}
