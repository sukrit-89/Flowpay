#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Symbol};

#[contracttype]
#[derive(Clone)]
pub struct Token {
    pub name: String,
    pub symbol: String,
    pub decimals: u32,
}

#[contract]
pub struct SimpleToken;

#[contractimpl]
impl SimpleToken {
    pub fn initialize(env: Env, name: String, symbol: String, decimals: u32) {
        if env.storage().instance().has(&Symbol::new(&env, "init")) {
            panic!("already initialized");
        }

        let token = Token {
            name,
            symbol,
            decimals,
        };

        env.storage().instance().set(&Symbol::new(&env, "token"), &token);
        env.storage().instance().set(&Symbol::new(&env, "init"), &());
    }

    pub fn mint(env: Env, _to: Address, amount: i128) {
        let balance_key = Symbol::new(&env, "balance");
        let current_balance: i128 = env.storage().instance().get(&balance_key).unwrap_or(0);
        let new_balance = current_balance + amount;
        env.storage().instance().set(&balance_key, &new_balance);
    }

    pub fn balance(env: Env, _account: Address) -> i128 {
        let balance_key = Symbol::new(&env, "balance");
        env.storage().instance().get(&balance_key).unwrap_or(0)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        // For simplicity, just check if there's enough balance and transfer
        let balance_key = Symbol::new(&env, "balance");
        let current_balance: i128 = env.storage().instance().get(&balance_key).unwrap_or(0);
        
        if current_balance < amount {
            panic!("insufficient balance");
        }
        
        // For demo purposes, just reduce the balance
        let new_balance = current_balance - amount;
        env.storage().instance().set(&balance_key, &new_balance);
    }
}
