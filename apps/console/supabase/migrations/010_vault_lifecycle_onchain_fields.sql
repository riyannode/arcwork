-- Migration 010: on-chain-first vault lifecycle fields
-- Append-only patch for tx/event verified lifecycle state mirroring.

ALTER TABLE public.vault_milestones
  ADD COLUMN IF NOT EXISTS tx_hash_submit TEXT,
  ADD COLUMN IF NOT EXISTS tx_hash_reject TEXT,
  ADD COLUMN IF NOT EXISTS tx_hash_dispute TEXT,
  ADD COLUMN IF NOT EXISTS auto_released BOOLEAN DEFAULT false;

ALTER TABLE public.vault_disputes
  ADD COLUMN IF NOT EXISTS tx_hash_open TEXT;

ALTER TABLE public.vault_jobs
  ADD COLUMN IF NOT EXISTS on_chain_job_id TEXT,
  ADD COLUMN IF NOT EXISTS tx_hash_accept TEXT;

CREATE INDEX IF NOT EXISTS idx_vault_milestones_tx_submit ON public.vault_milestones (tx_hash_submit);
CREATE INDEX IF NOT EXISTS idx_vault_milestones_tx_release ON public.vault_milestones (tx_hash_release);
CREATE INDEX IF NOT EXISTS idx_vault_jobs_tx_accept ON public.vault_jobs (tx_hash_accept);

NOTIFY pgrst, 'reload schema';
