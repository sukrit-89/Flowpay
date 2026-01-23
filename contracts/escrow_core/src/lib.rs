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
        usdc_token: String,
        min_lock_period: u64,
    ) {
        if env.storage().instance().has(&Symbol::new(&env, "init")) {
            panic!("already initialized");
        }

        // Store configuration
        env.storage().instance().set(&Symbol::new(&env, "yield_harvester"), &yield_harvester);
        env.storage().instance().set(&Symbol::new(&env, "liquidity_router"), &liquidity_router);
        env.storage().instance().set(&Symbol::new(&env, "usdc_token"), &usdc_token);
        env.storage().instance().set(&Symbol::new(&env, "min_lock_period"), &min_lock_period);

        // Initialize job counter
        env.storage().instance().set(&Symbol::new(&env, "job_counter"), &0u32);

        env.storage().instance().set(&Symbol::new(&env, "init"), &());
    }

    /// Create a new job with escrow
    pub fn create_job(
        env: Env,
        client: Address,
        freelancer: Address,
        total_amount: i128,
        asset_address: Address,
        milestone_count: u32,
    ) -> BytesN<32> {
        // Generate unique job ID using simple approach
        let mut counter: u32 = env.storage().instance().get(&Symbol::new(&env, "job_counter")).unwrap_or(0);
        counter += 1;
        env.storage().instance().set(&Symbol::new(&env, "job_counter"), &counter);

        // Create job ID from counter
        let job_id_bytes = counter.to_be_bytes();
        let mut job_id_array = [0u8; 32];
        job_id_array[28..].copy_from_slice(&job_id_bytes);
        let job_id = BytesN::from_array(&env, &job_id_array);

        // Create milestones
        let mut milestones = Vec::<Milestone>::new(&env);
        let milestone_amount = total_amount / milestone_count as i128;
        
        for i in 0..milestone_count {
            milestones.push_back(Milestone {
                milestone_id: i + 1,
                amount: milestone_amount,
                proof_url: String::from_str(&env, ""),
                status: MilestoneStatus::Pending,
            });
        }

        // Create job
        let job = Job {
            job_id: job_id.clone(),
            client: client.clone(),
            freelancer: freelancer.clone(),
            total_amount,
            asset_address: asset_address.clone(),
            milestones,
            status: JobStatus::Active,
            created_at: env.ledger().timestamp(),
            yield_earned: 0,
        };

        // Store job
        env.storage().instance().set(&job_id, &job);

        // Transfer funds to contract
        if asset_address != Address::from_string(&soroban_sdk::String::from_str(&env, "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF")) {
            // Only transfer token contracts, not native XLM
            let token_client = token::TokenClient::new(&env, &asset_address);
            token_client.transfer(&client, &env.current_contract_address(), &total_amount);
        } else {
            // For XLM, the transfer happens automatically when the transaction is submitted
            // The amount will be included in the transaction fee
        }

        // Deposit into YieldHarvester for yield generation
        let yield_harvester = Self::get_yield_harvester(&env);
        let mut args = Vec::new(&env);
        args.push_back(client.clone().into_val(&env));
        args.push_back(total_amount.into_val(&env));
        env.invoke_contract::<()>(
            &yield_harvester,
            &Symbol::new(&env, "deposit"),
            args,
        );

        // Store job principal tracking
        let principal_key = Symbol::new(&env, "principal_key");
        env.storage().instance().set(&principal_key, &total_amount);

        job_id
    }

    /// Get job details
    pub fn get_job(env: Env, job_id: BytesN<32>) -> Job {
        env.storage().instance().get(&job_id).unwrap_or_else(|| panic!("job not found"))
    }

    /// Get all jobs for a client
    pub fn get_client_jobs(env: Env, client: Address) -> Vec<Job> {
        let mut jobs = Vec::<Job>::new(&env);
        let counter: u32 = env.storage().instance().get(&Symbol::new(&env, "job_counter")).unwrap_or(0);

        for i in 1..=counter {
            let job_id_bytes = i.to_be_bytes();
            let mut job_id_array = [0u8; 32];
            job_id_array[28..].copy_from_slice(&job_id_bytes);
            let job_id = BytesN::from_array(&env, &job_id_array);

            if let Some(job) = env.storage().instance().get::<_, Job>(&job_id) {
                if job.client == client {
                    jobs.push_back(job);
                }
            }
        }

        jobs
    }

    /// Get all jobs for a freelancer
    pub fn get_freelancer_jobs(env: Env, freelancer: Address) -> Vec<Job> {
        let mut jobs = Vec::<Job>::new(&env);
        let counter: u32 = env.storage().instance().get(&Symbol::new(&env, "job_counter")).unwrap_or(0);

        for i in 1..=counter {
            let job_id_bytes = i.to_be_bytes();
            let mut job_id_array = [0u8; 32];
            job_id_array[28..].copy_from_slice(&job_id_bytes);
            let job_id = BytesN::from_array(&env, &job_id_array);

            if let Some(job) = env.storage().instance().get::<_, Job>(&job_id) {
                if job.freelancer == freelancer {
                    jobs.push_back(job);
                }
            }
        }

        jobs
    }

    /// Approve milestone
    pub fn approve_milestone(env: Env, job_id: BytesN<32>, milestone_id: u32) {
        let mut job = Self::get_job(env.clone(), job_id.clone());
        
        // Find and update milestone
        let mut milestone_found = false;
        for i in 0..job.milestones.len() {
            let mut milestone = job.milestones.get(i).unwrap();
            if milestone.milestone_id == milestone_id {
                milestone.status = MilestoneStatus::Approved;
                job.milestones.set(i, milestone);
                milestone_found = true;
                break;
            }
        }

        if !milestone_found {
            panic!("milestone not found");
        }

        // Update job
        env.storage().instance().set(&job_id, &job);
    }

    /// Release payment for milestone
    pub fn release_payment(
        env: Env,
        job_id: BytesN<32>,
        milestone_id: u32,
    ) {
        let mut job = Self::get_job(env.clone(), job_id.clone());
        
        // Find milestone
        let mut milestone_amount = 0i128;
        let mut milestone_found = false;
        
        for i in 0..job.milestones.len() {
            let mut milestone = job.milestones.get(i).unwrap();
            if milestone.milestone_id == milestone_id {
                if milestone.status != MilestoneStatus::Approved {
                    panic!("milestone not approved");
                }
                milestone_amount = milestone.amount;
                milestone.status = MilestoneStatus::Paid;
                job.milestones.set(i, milestone);
                milestone_found = true;
                break;
            }
        }

        if !milestone_found {
            panic!("milestone not found");
        }

        // Withdraw from YieldHarvester (principal + yield)
        let yield_harvester = Self::get_yield_harvester(&env);
        let mut args = Vec::new(&env);
        args.push_back(job.client.clone().into_val(&env));
        args.push_back(milestone_amount.into_val(&env));
        let total_withdraw = env.invoke_contract::<i128>(
            &yield_harvester,
            &Symbol::new(&env, "withdraw"),
            args,
        );

        // Transfer payment to freelancer
        let token_client = token::TokenClient::new(&env, &job.asset_address);
        token_client.transfer(&env.current_contract_address(), &job.freelancer, &milestone_amount);

        // Update principal tracking
        let principal_key = Symbol::new(&env, "principal_key");
        let current_principal: i128 = env.storage().instance().get(&principal_key).unwrap_or(0);
        let new_principal = current_principal - milestone_amount;
        env.storage().instance().set(&principal_key, &new_principal);

        // Update job
        env.storage().instance().set(&job_id, &job);

        // Check if all milestones are paid
        let all_paid = job.milestones.iter().all(|m| m.status == MilestoneStatus::Paid);
        if all_paid {
            job.status = JobStatus::Completed;
            env.storage().instance().set(&job_id, &job);
        }
    }

    /// Get YieldHarvester address
    fn get_yield_harvester(env: &Env) -> Address {
        env.storage().instance()
            .get(&Symbol::new(env, "yield_harvester"))
            .unwrap()
    }

    /// Get LiquidityRouter address
    fn get_liquidity_router(env: &Env) -> Address {
        env.storage().instance()
            .get(&Symbol::new(env, "liquidity_router"))
            .unwrap()
    }

    /// Get USDC token address
    fn get_usdc_token(env: &Env) -> Address {
        env.storage().instance()
            .get(&Symbol::new(env, "usdc_token"))
            .unwrap()
    }

    /// Cancel job and refund client
    pub fn cancel_job(env: Env, job_id: BytesN<32>) {
        let mut job = Self::get_job(env.clone(), job_id.clone());
        
        if job.status != JobStatus::Active {
            panic!("job not active");
        }

        // Calculate refund amount
        let principal_key = Symbol::new(&env, "principal_key");
        let refund_amount: i128 = env.storage().instance().get(&principal_key).unwrap_or(0);

        // Refund to client
        if refund_amount > 0 {
            let token_client = token::TokenClient::new(&env, &job.asset_address);
            token_client.transfer(&env.current_contract_address(), &job.client, &refund_amount);
        }

        // Update job status
        job.status = JobStatus::Cancelled;
        env.storage().instance().set(&job_id, &job);

        // Clear principal tracking
        env.storage().instance().remove(&principal_key);
    }
}
