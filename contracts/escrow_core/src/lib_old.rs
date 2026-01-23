#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec, BytesN, Symbol, token, IntoVal};

#[contracttype]
#[derive(Clone, PartialEq, Eq)]
pub enum JobStatus {
    Active,
    Completed,
    Disputed,
    Cancelled,
}

#[contracttype]
#[derive(Clone, PartialEq, Eq)]
pub enum MilestoneStatus {
    Pending,
    ProofSubmitted,
    Approved,
    Paid,
}

#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    pub milestone_id: u32,
    pub amount: i128,
    pub proof_url: String,
    pub status: MilestoneStatus,
}

#[contracttype]
#[derive(Clone)]
pub struct Job {
    pub job_id: BytesN<32>,
    pub client: Address,
    pub freelancer: Address,
    pub total_amount: i128,
    pub asset_address: Address,
    pub milestones: Vec<Milestone>,
    pub status: JobStatus,
    pub created_at: u64,
    pub yield_earned: i128,
}

#[contract]
pub struct EscrowCore;

#[contractimpl]
impl EscrowCore {
    /// Initialize contract with YieldHarvester and LiquidityRouter addresses
    pub fn initialize(
        env: Env,
        yield_harvester: Address,
        liquidity_router: Address,
        usdc_token: Address,
        ousg_token: Address,
    ) {
        // Only allow initialization once
        let key = Symbol::new(&env, "init");
        if env.storage().persistent().has(&key) {
            panic!("Contract already initialized");
        }
        
        env.storage().persistent().set(&key, &true);
        env.storage().persistent().set(&Symbol::new(&env, "yield_harvester"), &yield_harvester);
        env.storage().persistent().set(&Symbol::new(&env, "liquidity_router"), &liquidity_router);
        env.storage().persistent().set(&Symbol::new(&env, "usdc_token"), &usdc_token);
        env.storage().persistent().set(&Symbol::new(&env, "ousg_token"), &ousg_token);
    }
    
    /// Get YieldHarvester contract address
    fn get_yield_harvester(env: &Env) -> Address {
        env.storage().persistent().get(&Symbol::new(env, "yield_harvester")).unwrap()
    }
    
    /// Get LiquidityRouter contract address
    fn get_liquidity_router(env: &Env) -> Address {
        env.storage().persistent().get(&Symbol::new(env, "liquidity_router")).unwrap()
    }
    
    /// Get USDC token address
    fn get_usdc_token(env: &Env) -> Address {
        env.storage().persistent().get(&Symbol::new(env, "usdc_token")).unwrap()
    }
    
    /// Get OUSG token address
    fn get_ousg_token(env: &Env) -> Address {
        env.storage().persistent().get(&Symbol::new(env, "ousg_token")).unwrap()
    }
    
    /// Store principal amount deposited per job
    fn set_job_principal(env: &Env, job_id: &BytesN<32>, amount: i128) {
        let key = (Symbol::new(env, "job_principal"), job_id.clone());
        env.storage().persistent().set(&key, &amount);
    }
    
    /// Get principal amount deposited for a job
    fn get_job_principal(env: &Env, job_id: &BytesN<32>) -> i128 {
        let key = (Symbol::new(env, "job_principal"), job_id.clone());
        env.storage().persistent().get(&key).unwrap_or(0i128)
    }
    
    /// Decrease job principal (when milestone is paid)
    fn decrease_job_principal(env: &Env, job_id: &BytesN<32>, amount: i128) {
        let current = Self::get_job_principal(env, job_id);
        Self::set_job_principal(env, job_id, current - amount);
    }
    /// Create job with funds locked in escrow and auto-deposit into YieldHarvester
    pub fn create_job(
        env: Env,
        client: Address,
        freelancer: Address,
        total_amount: i128,
        asset_address: Address,
        milestone_count: u32,
    ) -> BytesN<32> {
        client.require_auth();
        
        // Transfer funds from client to contract (LOCK FUNDS)
        let token_client = token::TokenClient::new(&env, &asset_address);
        token_client.transfer(&client, &env.current_contract_address(), &total_amount);
        
        // Generate job ID
        let sequence = env.ledger().sequence();
        let timestamp = env.ledger().timestamp();
        let mut id_data = soroban_sdk::Bytes::new(&env);
        id_data.append(&soroban_sdk::Bytes::from_slice(&env, &sequence.to_be_bytes()));
        id_data.append(&soroban_sdk::Bytes::from_slice(&env, &timestamp.to_be_bytes()));
        let hash = env.crypto().sha256(&id_data);
        let job_id: BytesN<32> = hash.try_into().unwrap();
        
        // Create milestones
        let amount_per_milestone = total_amount / milestone_count as i128;
        let mut milestones = Vec::new(&env);
        for i in 0..milestone_count {
            milestones.push_back(Milestone {
                milestone_id: i,
                amount: amount_per_milestone,
                proof_url: String::from_str(&env, ""),
                status: MilestoneStatus::Pending,
            });
        }
        
        // Auto-deposit funds into YieldHarvester for yield generation
        // Only if asset is USDC (for now)
        let usdc_token = Self::get_usdc_token(&env);
        let ousg_token = Self::get_ousg_token(&env);
        let yield_harvester = Self::get_yield_harvester(&env);
        
        if asset_address == usdc_token {
            // Store principal amount for this job
            Self::set_job_principal(&env, &job_id, total_amount);
            
            // Transfer USDC to YieldHarvester first
            token_client.transfer(
                &env.current_contract_address(),
                &yield_harvester,
                &total_amount
            );
            
            // Call YieldHarvester::deposit_from_contract
            // This function accepts deposits from contracts and assigns yield to the client
            let yield_harvester_client = soroban_sdk::contractclient::ContractClient::new(&env, &yield_harvester);
            let _ousg_amount = yield_harvester_client.invoke::<i128>(
                &Symbol::new(&env, "deposit_from_contract"),
                soroban_sdk::vec![&env,
                    env.current_contract_address().to_val(), // from_contract
                    client.to_val(),                          // owner (client gets yield)
                    total_amount.into_val(),
                    usdc_token.to_val(),
                    ousg_token.to_val(),
                ]
            );
        }
        
        // Create job
        let job = Job {
            job_id: job_id.clone(),
            client: client.clone(),
            freelancer,
            total_amount,
            asset_address: asset_address.clone(),
            milestones,
            status: JobStatus::Active,
            created_at: env.ledger().timestamp(),
            yield_earned: 0,
        };
        
        env.storage().persistent().set(&job_id, &job);
        
        // Emit event
        env.events().publish(
            (Symbol::new(&env, "job_created"),),
            (job_id.clone(), client, total_amount, asset_address)
        );
        
        job_id
    }
    
    /// Freelancer submits proof of work
    pub fn submit_proof(
        env: Env,
        job_id: BytesN<32>,
        milestone_id: u32,
        proof_url: String,
    ) {
        let mut job: Job = env.storage().persistent().get(&job_id).unwrap();
        job.freelancer.require_auth();
        
        let mut milestone = job.milestones.get(milestone_id).unwrap();
        milestone.proof_url = proof_url.clone();
        milestone.status = MilestoneStatus::ProofSubmitted;
        job.milestones.set(milestone_id, milestone);
        
        env.storage().persistent().set(&job_id, &job);
        
        // Emit event
        env.events().publish(
            (Symbol::new(&env, "proof_submitted"),),
            (job_id, milestone_id, proof_url)
        );
    }
    
    /// Client approves milestone
    pub fn approve_milestone(
        env: Env,
        job_id: BytesN<32>,
        milestone_id: u32,
    ) {
        let mut job: Job = env.storage().persistent().get(&job_id).unwrap();
        job.client.require_auth();
        
        let mut milestone = job.milestones.get(milestone_id).unwrap();
        milestone.status = MilestoneStatus::Approved;
        job.milestones.set(milestone_id, milestone);
        
        env.storage().persistent().set(&job_id, &job);
        
        // Emit event
        env.events().publish(
            (Symbol::new(&env, "milestone_approved"),),
            (job_id, milestone_id)
        );
   }
    
    /// Release payment to freelancer (backward compatible - no currency conversion)
    pub fn release_payment(
        env: Env,
        job_id: BytesN<32>,
        milestone_id: u32,
    ) {
        Self::release_payment_with_conversion(env, job_id, milestone_id, None);
    }
    
    /// Release payment to freelancer with optional currency conversion
    /// Withdraws only principal from YieldHarvester, optionally routes through LiquidityRouter
    pub fn release_payment_with_conversion(
        env: Env,
        job_id: BytesN<32>,
        milestone_id: u32,
        to_asset: Option<Address>, // Optional: convert to different asset via LiquidityRouter
    ) {
        let mut job: Job = env.storage().persistent().get(&job_id).unwrap();
        job.client.require_auth();
        
        let mut milestone = job.milestones.get(milestone_id).unwrap();
        
        // Verify milestone is approved
        if milestone.status != MilestoneStatus::Approved {
            panic!("Milestone must be approved before payment release");
        }
        
        let usdc_token = Self::get_usdc_token(&env);
        let ousg_token = Self::get_ousg_token(&env);
        let yield_harvester = Self::get_yield_harvester(&env);
        
        // If job uses USDC and has principal in YieldHarvester, withdraw principal
        if job.asset_address == usdc_token {
            let job_principal = Self::get_job_principal(&env, &job_id);
            
            // Withdraw principal from YieldHarvester
            if job_principal > 0 && milestone.amount <= job_principal {
                let yield_harvester_client = soroban_sdk::contractclient::ContractClient::new(&env, &yield_harvester);
                let usdc_received = yield_harvester_client.invoke::<i128>(
                    &Symbol::new(&env, "withdraw_principal_for_owner"),
                    soroban_sdk::vec![&env,
                        job.client.to_val(),                      // owner (client)
                        milestone.amount.into_val(),                 // principal amount to withdraw
                        env.current_contract_address().to_val(),     // recipient (EscrowCore)
                        ousg_token.to_val(),
                        usdc_token.to_val(),
                    ]
                );
                
                // Decrease tracked principal
                Self::decrease_job_principal(&env, &job_id, milestone.amount);
                
                // If to_asset is specified and different from USDC, route through LiquidityRouter
                if let Some(target_asset) = to_asset {
                    if target_asset != usdc_token {
                        let liquidity_router = Self::get_liquidity_router(&env);
                        let router_client = soroban_sdk::contractclient::ContractClient::new(&env, &liquidity_router);
                        
                        // Transfer USDC to router first
                        let usdc_token_client = token::TokenClient::new(&env, &usdc_token);
                        usdc_token_client.transfer(
                            &env.current_contract_address(),
                            &liquidity_router,
                            &usdc_received
                        );
                        
                        // Convert and send to freelancer
                        let _converted_amount = router_client.invoke::<i128>(
                            &Symbol::new(&env, "convert_and_send"),
                            soroban_sdk::vec![&env,
                                usdc_token.to_val(),
                                target_asset.to_val(),
                                usdc_received.to_val(),
                                job.freelancer.to_val(),
                                100i128.into_val(), // 1% max slippage
                            ]
                        );
                    } else {
                        // Send USDC directly to freelancer
                        let usdc_token_client = token::TokenClient::new(&env, &usdc_token);
                        usdc_token_client.transfer(
                            &env.current_contract_address(),
                            &job.freelancer,
                            &usdc_received
                        );
                    }
                } else {
                    // Send USDC directly to freelancer
                    let usdc_token_client = token::TokenClient::new(&env, &usdc_token);
                    usdc_token_client.transfer(
                        &env.current_contract_address(),
                        &job.freelancer,
                        &usdc_received
                    );
                }
            } else {
                // Fallback: direct transfer if no YieldHarvester integration
                let token_client = token::TokenClient::new(&env, &job.asset_address);
                token_client.transfer(
                    &env.current_contract_address(),
                    &job.freelancer,
                    &milestone.amount
                );
            }
        } else {
            // Non-USDC assets: direct transfer
            let token_client = token::TokenClient::new(&env, &job.asset_address);
            token_client.transfer(
                &env.current_contract_address(),
                &job.freelancer,
                &milestone.amount
            );
        }
        
        // Update milestone status
        milestone.status = MilestoneStatus::Paid;
        job.milestones.set(milestone_id, milestone);
        
        // Check if all milestones paid
        let mut all_paid = true;
        for i in 0..job.milestones.len() {
            let ms = job.milestones.get(i).unwrap();
            if ms.status != MilestoneStatus::Paid {
                all_paid = false;
                break;
            }
        }
        
        if all_paid {
            job.status = JobStatus::Completed;
        }
        
        env.storage().persistent().set(&job_id, &job);
        
        // Emit event
        let milestone_amount = milestone.amount;
        env.events().publish(
            (Symbol::new(&env, "payment_released"),),
            (job_id, milestone_id, milestone_amount, job.freelancer.clone())
        );
    }
    
    /// Cancel job and refund client all remaining balance (principal + yield)
    pub fn cancel_job(
        env: Env,
        job_id: BytesN<32>,
    ) {
        let mut job: Job = env.storage().persistent().get(&job_id).unwrap();
        job.client.require_auth();
        
        let usdc_token = Self::get_usdc_token(&env);
        let ousg_token = Self::get_ousg_token(&env);
        let yield_harvester = Self::get_yield_harvester(&env);
        
        // Calculate refund amount (unpaid milestones)
        let mut refund_amount = 0i128;
        for i in 0..job.milestones.len() {
            let milestone = job.milestones.get(i).unwrap();
            if milestone.status != MilestoneStatus::Paid {
                refund_amount += milestone.amount;
            }
        }
        
        if refund_amount > 0 {
            // If job uses USDC and has principal in YieldHarvester, withdraw all remaining
            if job.asset_address == usdc_token {
                let remaining_principal = Self::get_job_principal(&env, &job_id);
                
                if remaining_principal > 0 {
                    // Withdraw all remaining balance (principal + yield) from YieldHarvester
                    // Use the full withdraw function to get principal + yield
                    let yield_harvester_client = soroban_sdk::contractclient::ContractClient::new(&env, &yield_harvester);
                    
                    // Get position to calculate total withdrawable amount
                    let position: soroban_sdk::contractclient::ContractClient = yield_harvester_client.clone();
                    let position_data = position.invoke::<soroban_sdk::Val>(
                        &Symbol::new(&env, "get_position"),
                        soroban_sdk::vec![&env, job.client.to_val()]
                    );
                    
                    // Calculate total OUSG to withdraw (all remaining)
                    // For simplicity, withdraw based on remaining principal
                    // In production, you'd calculate based on OUSG balance
                    let ousg_to_withdraw = remaining_principal; // 1:1 ratio for mock
                    
                    // Withdraw all remaining (principal + yield)
                    let usdc_refunded = yield_harvester_client.invoke::<i128>(
                        &Symbol::new(&env, "withdraw"),
                        soroban_sdk::vec![&env,
                            job.client.to_val(),
                            ousg_to_withdraw.into_val(),
                            ousg_token.to_val(),
                            usdc_token.to_val(),
                        ]
                    );
                    
                    // Transfer to client
                    let usdc_token_client = token::TokenClient::new(&env, &usdc_token);
                    usdc_token_client.transfer(
                        &env.current_contract_address(),
                        &job.client,
                        &usdc_refunded
                    );
                    
                    // Clear job principal tracking
                    Self::set_job_principal(&env, &job_id, 0);
                    
                    refund_amount = usdc_refunded; // Update refund amount to actual amount received
                } else {
                    // No YieldHarvester balance, refund directly
                    let token_client = token::TokenClient::new(&env, &job.asset_address);
                    token_client.transfer(
                        &env.current_contract_address(),
                        &job.client,
                        &refund_amount
                    );
                }
            } else {
                // Non-USDC assets: direct refund
                let token_client = token::TokenClient::new(&env, &job.asset_address);
                token_client.transfer(
                    &env.current_contract_address(),
                    &job.client,
                    &refund_amount
                );
            }
        }
        
        job.status = JobStatus::Cancelled;
        env.storage().persistent().set(&job_id, &job);
        
        // Emit event
        env.events().publish(
            (Symbol::new(&env, "job_cancelled"),),
            (job_id, refund_amount)
        );
    }
    
    /// Finalize job and withdraw all remaining yield to client
    /// Call this after all milestones are paid to claim remaining yield
    pub fn finalize_job(
        env: Env,
        job_id: BytesN<32>,
    ) {
        let job: Job = env.storage().persistent().get(&job_id).unwrap();
        job.client.require_auth();
        
        // Only allow finalization if job is completed
        if job.status != JobStatus::Completed {
            panic!("Job must be completed before finalization");
        }
        
        let usdc_token = Self::get_usdc_token(&env);
        let ousg_token = Self::get_ousg_token(&env);
        let yield_harvester = Self::get_yield_harvester(&env);
        
        // If job uses USDC, withdraw any remaining balance (yield)
        if job.asset_address == usdc_token {
            let remaining_principal = Self::get_job_principal(&env, &job_id);
            
            if remaining_principal > 0 {
                // Withdraw all remaining (should be mostly yield at this point)
                let yield_harvester_client = soroban_sdk::contractclient::ContractClient::new(&env, &yield_harvester);
                let ousg_to_withdraw = remaining_principal; // In production, calculate actual OUSG balance
                
                let usdc_withdrawn = yield_harvester_client.invoke::<i128>(
                    &Symbol::new(&env, "withdraw"),
                    soroban_sdk::vec![&env,
                        job.client.to_val(),
                        ousg_to_withdraw.into_val(),
                        ousg_token.to_val(),
                        usdc_token.to_val(),
                    ]
                );
                
                // Transfer yield to client
                let usdc_token_client = token::TokenClient::new(&env, &usdc_token);
                usdc_token_client.transfer(
                    &env.current_contract_address(),
                    &job.client,
                    &usdc_withdrawn
                );
                
                // Clear job principal tracking
                Self::set_job_principal(&env, &job_id, 0);
                
                // Update yield_earned in job
                let mut job_mut = job;
                job_mut.yield_earned = usdc_withdrawn - remaining_principal; // Yield = withdrawn - principal
                env.storage().persistent().set(&job_id, &job_mut);
                
                // Emit event
                env.events().publish(
                    (Symbol::new(&env, "job_finalized"),),
                    (job_id, usdc_withdrawn, job_mut.yield_earned)
                );
            }
        }
    }
    
    /// Get job details
    pub fn get_job(env: Env, job_id: BytesN<32>) -> Job {
        env.storage().persistent().get(&job_id).unwrap()
    }
}
