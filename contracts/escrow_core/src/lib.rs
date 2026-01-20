#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String, Vec, BytesN};

#[contracttype]
#[derive(Clone)]
pub enum JobStatus {
    Active,
    Completed,
    Disputed,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
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
    pub fn create_job(
        env: Env,
        client: Address,
        freelancer: Address,
        total_amount: i128,
        asset_address: Address,
        milestone_count: u32,
    ) -> BytesN<32> {
        client.require_auth();
        
        let job_id = env.crypto().sha256(&env.ledger().sequence().to_be_bytes());
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
        
        let job = Job {
            job_id: job_id.clone(),
            client: client.clone(),
            freelancer,
            total_amount,
            asset_address,
            milestones,
            status: JobStatus::Active,
            created_at: env.ledger().timestamp(),
            yield_earned: 0,
        };
        
        env.storage().persistent().set(&job_id, &job);
        job_id
    }
    
    pub fn submit_proof(
        env: Env,
        job_id: BytesN<32>,
        milestone_id: u32,
        proof_url: String,
    ) {
        let mut job: Job = env.storage().persistent().get(&job_id).unwrap();
        job.freelancer.require_auth();
        
        let mut milestone = job.milestones.get(milestone_id).unwrap();
        milestone.proof_url = proof_url;
        milestone.status = MilestoneStatus::ProofSubmitted;
        job.milestones.set(milestone_id, milestone);
        
        env.storage().persistent().set(&job_id, &job);
    }
    
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
    }
    
    pub fn get_job(env: Env, job_id: BytesN<32>) -> Job {
        env.storage().persistent().get(&job_id).unwrap()
    }
}
