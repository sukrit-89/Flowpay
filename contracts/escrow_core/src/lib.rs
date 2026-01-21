#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec, BytesN, Symbol, token};

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
    /// Create job with funds locked in escrow
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
    
    /// Release payment to freelancer (NEW - CRITICAL FUNCTION)
    pub fn release_payment(
        env: Env,
        job_id: BytesN<32>,
        milestone_id: u32,
    ) {
        let mut job: Job = env.storage().persistent().get(&job_id).unwrap();
        job.client.require_auth();
        
        let mut milestone = job.milestones.get(milestone_id).unwrap();
        
        // Verify milestone is approved
        if milestone.status != MilestoneStatus::Approved {
            panic!("Milestone must be approved before payment release");
        }
        
        // Transfer funds from contract to freelancer
        let token_client = token::TokenClient::new(&env, &job.asset_address);
        token_client.transfer(
            &env.current_contract_address(),
            &job.freelancer,
            &milestone.amount
        );
        
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
    
    /// Cancel job and refund client (if no milestones paid)
    pub fn cancel_job(
        env: Env,
        job_id: BytesN<32>,
    ) {
        let mut job: Job = env.storage().persistent().get(&job_id).unwrap();
        job.client.require_auth();
        
        // Calculate refund amount (unpaid milestones)
        let mut refund_amount = 0i128;
        for i in 0..job.milestones.len() {
            let milestone = job.milestones.get(i).unwrap();
            if milestone.status != MilestoneStatus::Paid {
                refund_amount += milestone.amount;
            }
        }
        
        if refund_amount > 0 {
            // Refund unpaid milestones to client
            let token_client = token::TokenClient::new(&env, &job.asset_address);
            token_client.transfer(
                &env.current_contract_address(),
                &job.client,
                &refund_amount
            );
        }
        
        job.status = JobStatus::Cancelled;
        env.storage().persistent().set(&job_id, &job);
        
        // Emit event
        env.events().publish(
            (Symbol::new(&env, "job_cancelled"),),
            (job_id, refund_amount)
        );
    }
    
    /// Get job details
    pub fn get_job(env: Env, job_id: BytesN<32>) -> Job {
        env.storage().persistent().get(&job_id).unwrap()
    }
}
